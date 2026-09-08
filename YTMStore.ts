/*
 * YouTubeMusicPlayer — YTMStore.ts
 *
 * Resilient Flux Store interfacing with local YouTube Music companion servers.
 *
 * Architecture Highlights:
 *  • Optimistic UI mutations: local state flips immediately before firing network calls (0ms perceived latency).
 *  • Automated 4-digit PIN authentication handshake via POST /auth/requestcode & POST /auth/request.
 *  • Token persistence directly into Vencord plugin settings storage.
 *  • 6-second polling loop designed to stay within ytmdesktop v2 rate limits (max 1 req / 5s).
 *  • Silent HTTP 429 backoff handling to prevent UI flickering.
 *  • Automatic 401/403 credential invalidation and auto-recovery flow.
 */

import { proxyLazy } from "@utils/lazy";
import { Flux, FluxDispatcher } from "@webpack/common";

import { settings } from "./index";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface YTMTrack {
    title: string;
    artist: string;
    album: string;
    thumbnail: string;
    duration: number; // seconds
    url: string;
    id: string;
    liked: boolean;
    disliked: boolean;
}

export type RepeatMode = "none" | "all" | "one";
export type AuthStage = "idle" | "needsAuth" | "waitingApproval" | "connected" | "error";

interface StoreState {
    authStage: AuthStage;
    statusText: string;
    track: YTMTrack | null;
    isPlaying: boolean;
    position: number;
    volume: number;
    shuffled: boolean;
    repeatMode: RepeatMode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const APP_ID = "vencord-ytm-plugin";
const APP_NAME = "Vencord YouTube Music";
const APP_VERSION = "1.0.0";
const POLL_MS = 6_000; // ytmdesktop rate-limit: 1 req / 5s

// ytmdesktop v2 likeStatus: DISLIKE=0, INDIFFERENT=1, LIKE=2
const parseLiked = (v: unknown) => (typeof v === "string" ? v.toUpperCase() === "LIKE" : v === 2);
const parseDisliked = (v: unknown) => (typeof v === "string" ? v.toUpperCase() === "DISLIKE" : v === 0);
const parseRepeat = (n: number): RepeatMode => (n === 2 ? "one" : n === 1 ? "all" : "none");

// ─── Store Definition ─────────────────────────────────────────────────────────

export const YTMStore = proxyLazy(() => {
    const s: StoreState = {
        authStage: "idle",
        statusText: "",
        track: null,
        isPlaying: false,
        position: 0,
        volume: 100,
        shuffled: false,
        repeatMode: "none",
    };

    let pollTimer: ReturnType<typeof setInterval> | null = null;

    // ── Internal Helpers ──────────────────────────────────────────────────────

    const port = () => settings.store?.wsPort ?? 9863;
    const token = () => settings.store?.apiToken ?? "";
    const base = () => `http://localhost:${port()}/api/v1`;

    function set(patch: Partial<StoreState>) {
        Object.assign(s, patch);
        store.emitChange();
    }

    async function api(path: string, method: "GET" | "POST" = "GET", body?: object) {
        const tok = token();
        try {
            const r = await fetch(`${base()}${path}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(tok ? { Authorization: tok } : {}),
                },
                body: body ? JSON.stringify(body) : undefined,
            });
            let data: any = null;
            try {
                data = await r.clone().json();
            } catch {
                data = {};
            }
            return { ok: r.ok, status: r.status, data };
        } catch {
            return { ok: false, status: 0, data: null };
        }
    }

    // ── PIN Authentication Flow ───────────────────────────────────────────────

    async function startAuth() {
        set({ authStage: "needsAuth", statusText: "⚡ Requesting pairing code…" });

        const r1 = await api("/auth/requestcode", "POST", {
            appId: APP_ID,
            appVersion: APP_VERSION,
            appName: APP_NAME,
        });

        if (r1.status === 403) {
            set({
                authStage: "needsAuth",
                statusText: '⚠ Enable "companion authorization" in ytmdesktop → Settings → Integrations, then re-enable plugin.',
            });
            return;
        }

        if (!r1.ok || !r1.data?.code) {
            set({ authStage: "error", statusText: `Auth request failed (${r1.status})` });
            return;
        }

        const code = String(r1.data.code);
        set({
            authStage: "waitingApproval",
            statusText: `🔑 PIN: ${code} — click Authorize in the ytmdesktop companion popup`,
        });

        const r2 = await api("/auth/request", "POST", { appId: APP_ID, code });
        if (!r2.ok || !r2.data?.token) {
            set({
                authStage: "needsAuth",
                statusText: "Authorization timed out. Toggle the plugin in Vencord settings to retry.",
            });
            return;
        }

        try {
            settings.store.apiToken = r2.data.token;
        } catch {
            /* settings store persistence */
        }
        set({ authStage: "connected", statusText: "" });
        startPolling();
    }

    // ── State Polling ─────────────────────────────────────────────────────────

    async function pollState() {
        const r = await api("/state");

        // 429: Rate-limited — silently skip to avoid UI flickering
        if (r.status === 429) return;

        // 401/403: Invalidated credentials — clear token and restart handshake
        if (r.status === 401 || r.status === 403) {
            try {
                settings.store.apiToken = "";
            } catch {
                /* settings store persistence */
            }
            stopPolling();
            startAuth();
            return;
        }

        if (!r.ok) {
            set({ authStage: "error", statusText: `Companion offline (${r.status || "unreachable"})` });
            return;
        }

        const data = r.data;
        const video = data?.video ?? data?.track ?? null;
        const player = data?.player ?? null;
        const queue = player?.queue ?? {};

        const track: YTMTrack | null = video
            ? {
                  title: video.title ?? "Unknown Track",
                  artist: video.author ?? video.artist ?? "Unknown Artist",
                  album: video.album ?? "",
                  // Sort available thumbnails by resolution (highest first)
                  thumbnail:
                      [...(video.thumbnails ?? [])].sort(
                          (a: any, b: any) => (b.width ?? 0) - (a.width ?? 0),
                      )[0]?.url ??
                      video.thumbnail ??
                      "",
                  duration: video.durationSeconds ?? video.duration ?? 0,
                  url: video.id ? `https://music.youtube.com/watch?v=${video.id}` : "",
                  id: video.id ?? "",
                  liked: parseLiked(video.likeStatus ?? 1),
                  disliked: parseDisliked(video.likeStatus ?? 1),
              }
            : null;

        set({
            authStage: "connected",
            statusText: "",
            track,
            isPlaying: player?.trackState === 1,
            position: player?.videoProgress ?? 0,
            volume: player?.volume ?? 100,
            shuffled: queue.isShuffled ?? false,
            repeatMode: parseRepeat(queue.repeatMode ?? 0),
        });
    }

    function startPolling() {
        if (pollTimer) return;
        pollState(); // Initial immediate poll
        pollTimer = setInterval(pollState, POLL_MS);
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    // ── Command Dispatcher (Optimistic Local State Application) ───────────────

    function cmd(command: string, data?: unknown) {
        api("/command", "POST", data !== undefined ? { command, data } : { command });
    }

    // ── Flux Store Instance ───────────────────────────────────────────────────

    const store = new (class YTMFluxStore extends Flux.Store {
        get connected() {
            return s.authStage === "connected";
        }
        get authStage() {
            return s.authStage;
        }
        get statusText() {
            return s.statusText;
        }
        get track() {
            return s.track;
        }
        get isPlaying() {
            return s.isPlaying;
        }
        get position() {
            return s.position;
        }
        get volume() {
            return s.volume;
        }
        get shuffled() {
            return s.shuffled;
        }
        get repeatMode() {
            return s.repeatMode;
        }

        connect() {
            if (token()) {
                set({ authStage: "connected", statusText: "Connecting to companion…" });
                startPolling();
            } else {
                startAuth();
            }
        }

        disconnect() {
            stopPolling();
            set({ authStage: "idle", statusText: "" });
        }

        // Optimistic Media Controls
        playPause() {
            set({ isPlaying: !s.isPlaying });
            cmd("playPause");
        }

        next() {
            set({ isPlaying: true });
            cmd("next");
        }

        previous() {
            set({ isPlaying: true });
            cmd("previous");
        }

        seek(secs: number) {
            set({ position: secs });
            cmd("seekTo", secs);
        }

        setVolume(v: number) {
            const vol = Math.round(Math.max(0, Math.min(100, v)));
            set({ volume: vol });
            cmd("setVolume", vol);
        }

        toggleShuffle() {
            set({ shuffled: !s.shuffled });
            cmd("shuffle");
        }

        toggleRepeat() {
            const next: RepeatMode =
                s.repeatMode === "none" ? "one" : s.repeatMode === "one" ? "all" : "none";
            set({ repeatMode: next });
            cmd("repeatMode", next === "one" ? "ONE" : next === "all" ? "NONE");
        }

        toggleLike() {
            if (!s.track) return;
            set({ track: { ...s.track, liked: !s.track.liked, disliked: false } });
            cmd("toggleLike");
        }

        toggleDislike() {
            if (!s.track) return;
            set({ track: { ...s.track, disliked: !s.track.disliked, liked: false } });
            cmd("toggleDislike");
        }

        openInBrowser() {
            if (s.track?.url) window.open(s.track.url, "_blank");
        }
    })(FluxDispatcher, {});

    return store;
});
