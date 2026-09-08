/*
 * Vencord userplugin — YouTubeMusicPlayer
 * Embeds a YouTube Music player bar above the Discord account panel with Rich Presence sync.
 *
 * Requirements (pick ONE companion method):
 *   A) YouTube Music Desktop App (ytmdesktop v2) → Settings → Integrations → Enable Companion Server (port 9863)
 *   B) th-ch/youtube-music                      → Settings → Plugins → Companion Server (port 9863)
 *
 * Rich Presence:
 *   1. Create an application at https://discord.com/developers/applications (name it "YouTube Music")
 *   2. Upload an asset named "ytm-logo" (256×256 YouTube Music logo PNG)
 *   3. Copy your Application ID into the plugin settings below
 */

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin, { OptionType } from "@utils/types";
import { ActivityFlags, ActivityType } from "@vencord/discord-types/enums";
import { ApplicationAssetUtils, FluxDispatcher, React } from "@webpack/common";

import { Player } from "./PlayerComponent";
import { YTMStore } from "./YTMStore";

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settings = definePluginSettings({
    wsPort: {
        type: OptionType.NUMBER,
        description: "Companion server port — ytmdesktop v2 / th-ch default: 9863",
        default: 9863,
        restartNeeded: true,
    },
    apiToken: {
        type: OptionType.STRING,
        description: "Authorization token (auto-negotiated via PIN — leave blank to re-pair)",
        default: "",
        restartNeeded: false,
    },
    showPanel: {
        type: OptionType.BOOLEAN,
        description: "Show YouTube Music player panel above account panel",
        default: true,
        restartNeeded: false,
    },
    showRichPresence: {
        type: OptionType.BOOLEAN,
        description: "Broadcast currently playing track as Discord Rich Presence",
        default: true,
        restartNeeded: false,
    },
    discordAppId: {
        type: OptionType.STRING,
        description: "Discord Application ID for Rich Presence (from discord.com/developers/applications)",
        default: "1234567890123456789",
        restartNeeded: false,
    },
    useListeningStatus: {
        type: OptionType.BOOLEAN,
        description: 'Show "Listening to" instead of "Playing" in status',
        default: true,
        restartNeeded: false,
    },
    showAlbumArt: {
        type: OptionType.BOOLEAN,
        description: "Show album art in Rich Presence",
        default: true,
        restartNeeded: false,
    },
    showElapsedTime: {
        type: OptionType.BOOLEAN,
        description: "Show elapsed / remaining track time in Rich Presence",
        default: true,
        restartNeeded: false,
    },
    showOpenButton: {
        type: OptionType.BOOLEAN,
        description: 'Show "Open in YouTube Music" button in Rich Presence',
        default: true,
        restartNeeded: false,
    },
});

// ─── Rich Presence Dispatcher ──────────────────────────────────────────────────

function clearActivity() {
    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: null,
        socketId: "YouTubeMusicPlayer",
    });
}

async function fetchAsset(appId: string, key: string): Promise<string> {
    try {
        const ids = await ApplicationAssetUtils.fetchAssetIds(appId, [key]);
        return ids[0] ?? key;
    } catch {
        return key;
    }
}

async function updatePresence() {
    const s = settings.store;
    if (!s.showRichPresence) return;

    const track = YTMStore.track;
    const isPlaying = YTMStore.isPlaying;

    if (!track || !isPlaying) {
        clearActivity();
        return;
    }

    const appId = s.discordAppId || "1234567890123456789";

    // Build assets
    let large_image: string;
    let large_text: string;
    let small_image: string | undefined;
    let small_text: string | undefined;

    if (s.showAlbumArt && track.thumbnail) {
        large_image = await fetchAsset(appId, track.thumbnail);
        large_text = (track.album || track.title).slice(0, 128);
        small_image = await fetchAsset(appId, "ytm-logo");
        small_text = "YouTube Music";
    } else {
        large_image = await fetchAsset(appId, "ytm-logo");
        large_text = "YouTube Music";
    }

    // Build timestamps
    let timestamps: Record<string, number> | undefined;
    if (s.showElapsedTime && track.duration > 0) {
        const livePos = YTMStore.position;
        const nowMs = Date.now();
        timestamps = {
            start: Math.floor((nowMs - livePos * 1000) / 1000),
            end: Math.floor((nowMs + (track.duration - livePos) * 1000) / 1000),
        };
    }

    // Build buttons
    const buttons: string[] = [];
    const buttonUrls: string[] = [];
    if (s.showOpenButton && track.url) {
        buttons.push("Open in YouTube Music");
        buttonUrls.push(track.url);
    }

    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        socketId: "YouTubeMusicPlayer",
        activity: {
            application_id: appId,
            name: "YouTube Music",
            details: track.title.slice(0, 128),
            state: `by ${track.artist}`.slice(0, 128),
            type: s.useListeningStatus ? ActivityType.LISTENING : ActivityType.PLAYING,
            flags: ActivityFlags.INSTANCE,
            assets: {
                large_image,
                large_text,
                ...(small_image ? { small_image, small_text } : {}),
            },
            ...(timestamps ? { timestamps } : {}),
            ...(buttons.length ? { buttons, metadata: { button_urls: buttonUrls } } : {}),
        },
    });
}

// ─── Plugin Definition ─────────────────────────────────────────────────────────

export default definePlugin({
    name: "YouTubeMusicPlayer",
    description: "YouTube Music player panel above the account panel + Rich Presence for currently playing tracks.",
    authors: [{ id: 0n, name: "raghavatgit" }],
    tags: ["Activity", "Media"],
    settings,

    _presenceInterval: null as ReturnType<typeof setInterval> | null,

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    start() {
        YTMStore.connect();
        // Sync presence every 15s (standard Vencord musicRichPresence timing)
        this._presenceInterval = setInterval(() => { updatePresence(); }, 15_000);
        updatePresence();
    },

    stop() {
        YTMStore.disconnect();
        if (this._presenceInterval) {
            clearInterval(this._presenceInterval);
            this._presenceInterval = null;
        }
        clearActivity();
    },

    // ── Account Panel Webpack AST Patch ────────────────────────────────────────
    // Safely replaces the user profile popout wrapper to render <Player> directly above it
    patches: [
        {
            find: "#{intl::USER_PROFILE_ACCOUNT_POPOUT_BUTTON_A11Y_LABEL}",
            replacement: {
                match: /(?<=\i\.jsxs?\)\()(\i),{(?=[^}]*?userTag:\i,occluded:)/,
                replace: "$self.PanelWrapper,{VencordOriginal:$1,",
            },
        },
    ],

    PanelWrapper({ VencordOriginal, ...props }: { VencordOriginal: React.ComponentType<any>; [k: string]: any; }) {
        return (
            <>
                {settings.store.showPanel && (
                    <ErrorBoundary
                        fallback={() => (
                            <div style={{ padding: "0.5em", color: "var(--text-muted)", fontSize: 11 }}>
                                YouTubeMusicPlayer failed to render. Check console for details.
                            </div>
                        )}
                    >
                        <Player />
                    </ErrorBoundary>
                )}
                <VencordOriginal {...props} />
            </>
        );
    },
});
