/*
 * YouTubeMusicPlayer Vencord userplugin — PlayerComponent.tsx
 *
 * Interactive mini-player UI embedded above Discord's user account bar.
 * Features:
 *   - Ambient album art blurred backdrop
 *   - Interactive scrubbing seek bar with mouse tracking
 *   - Real-time volume slider with quick-mute toggle
 *   - Dual like/dislike buttons with active feedback
 *   - Auto-idle sleep timer (hides after 5 minutes of paused playback)
 */

import "./ytmStyles.css";

import { classes } from "@utils/misc";
import { formatDuration } from "@utils/text";
import { React, useEffect, useState, useStateFromStores } from "@webpack/common";

import { YTMStore } from "./YTMStore";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function Icon({ d, size = 20, label }: { d: string; size?: number; label: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-label={label}>
            <path d={d} />
        </svg>
    );
}

const IC = {
    play: "M8 5v14l11-7z",
    pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
    next: "M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z",
    prev: "M6 6h2v12H6zm3.5 6 8.5 6V6z",
    shuffle:
        "M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41ZM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4ZM14.83 13.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04z",
    repeatAll: "M7 7h10v3l4-4-4-4v3H5v6h2Zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z",
    repeatOne:
        "M7 7h10v3l4-4-4-4v3H5v6h2Zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4Z",
    thumbUp:
        "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z",
    thumbDown:
        "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z",
    openExt:
        "M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7ZM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3Z",
} as const;

// ─── Seek Bar Component ───────────────────────────────────────────────────────

function SeekBar() {
    const duration = useStateFromStores([YTMStore], () => YTMStore.track?.duration ?? 0);
    const [storePos, isPlaying] = useStateFromStores(
        [YTMStore],
        () => [YTMStore.position, YTMStore.isPlaying] as const,
    );

    const [pos, setPos] = useState(storePos);
    const [dragging, setDrag] = useState(false);
    const trackRef = React.useRef<HTMLDivElement>(null);

    // Smooth second ticker when playing (paused during manual scrubbing)
    useEffect(() => {
        if (dragging) return;
        setPos(storePos);
        if (!isPlaying) return;
        const iv = setInterval(() => setPos((p) => Math.min(p + 1, duration)), 1000);
        return () => clearInterval(iv);
    }, [storePos, isPlaying, duration, dragging]);

    const pct = duration > 0 ? Math.min(100, (pos / duration) * 100) : 0;

    function posFromMouse(clientX: number): number {
        const rect = trackRef.current!.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return ratio * duration;
    }

    function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        e.preventDefault();
        const startPos = posFromMouse(e.clientX);
        setPos(startPos);
        setDrag(true);

        function onMove(ev: MouseEvent) {
            setPos(posFromMouse(ev.clientX));
        }

        function onUp(ev: MouseEvent) {
            const finalPos = posFromMouse(ev.clientX);
            setPos(finalPos);
            setDrag(false);
            YTMStore.seek(finalPos);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        }

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    return (
        <div className="vc-ytm-seek-row">
            <span className="vc-ytm-time">{formatDuration(Math.round(pos) * 1000)}</span>
            <div
                ref={trackRef}
                className={classes("vc-ytm-track", dragging ? "vc-ytm-track--drag" : "")}
                onMouseDown={handleMouseDown}
            >
                <div className="vc-ytm-fill" style={{ width: `${pct}%` }} />
                <div
                    className="vc-ytm-thumb"
                    style={{ left: `${pct}%`, opacity: dragging ? 1 : undefined }}
                />
            </div>
            <span className="vc-ytm-time vc-ytm-time-right">{formatDuration(duration * 1000)}</span>
        </div>
    );
}

// ─── Volume Slider Component ──────────────────────────────────────────────────

const VOL_ICONS = {
    mute: "M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-13.27-9L4 4.27 7.73 8H3v8h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.73 3 3.46 4.27zM12 4 9.91 6.09 12 8.18V4z",
    low: "M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z",
    mid: "M18.5 12A4.5 4.5 0 0 0 16 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z",
    high: "M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z",
};

function VolumeSlider() {
    const storeVol = useStateFromStores([YTMStore], () => YTMStore.volume);
    const [vol, setVol] = useState(storeVol);
    const [dragging, setDrag] = useState(false);
    const trackRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!dragging) setVol(storeVol);
    }, [storeVol, dragging]);

    const pct = Math.round(Math.max(0, Math.min(100, vol)));

    const iconPath =
        pct === 0
            ? VOL_ICONS.mute
            : pct < 40
            ? VOL_ICONS.low
            : pct < 70
            ? VOL_ICONS.mid
            : VOL_ICONS.high;

    function posFromMouse(clientX: number): number {
        const rect = trackRef.current!.getBoundingClientRect();
        return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    }

    function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
        e.preventDefault();
        const v = posFromMouse(e.clientX);
        setVol(v);
        setDrag(true);

        function onMove(ev: MouseEvent) {
            setVol(posFromMouse(ev.clientX));
        }

        function onUp(ev: MouseEvent) {
            const final = posFromMouse(ev.clientX);
            setVol(final);
            setDrag(false);
            YTMStore.setVolume(final);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        }

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    return (
        <div className="vc-ytm-vol-row">
            <span
                className="vc-ytm-vol-icon"
                onClick={() => YTMStore.setVolume(pct === 0 ? 50 : 0)}
                title={pct === 0 ? "Unmute" : "Mute"}
            >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
                    <path d={iconPath} />
                </svg>
            </span>
            <div
                ref={trackRef}
                className={classes("vc-ytm-vol-track", dragging ? "vc-ytm-vol-track--drag" : "")}
                onMouseDown={handleMouseDown}
            >
                <div className="vc-ytm-vol-fill" style={{ width: `${pct}%` }} />
                <div
                    className="vc-ytm-vol-thumb"
                    style={{ left: `${pct}%`, opacity: dragging ? 1 : undefined }}
                />
            </div>
            <span className="vc-ytm-vol-pct">{pct}%</span>
        </div>
    );
}

// ─── Playback Controls ────────────────────────────────────────────────────────

function Controls() {
    const [isPlaying, shuffled, repeatMode] = useStateFromStores(
        [YTMStore],
        () => [YTMStore.isPlaying, YTMStore.shuffled, YTMStore.repeatMode] as const,
    );

    return (
        <div className="vc-ytm-controls">
            {/* Shuffle */}
            <button
                className={classes("vc-ytm-btn vc-ytm-btn-sm", shuffled ? "vc-ytm-on" : "")}
                onClick={() => YTMStore.toggleShuffle()}
                title="Shuffle"
            >
                <Icon d={IC.shuffle} size={16} label="shuffle" />
            </button>

            {/* Previous */}
            <button
                className="vc-ytm-btn vc-ytm-btn-md"
                onClick={() => YTMStore.previous()}
                title="Previous"
            >
                <Icon d={IC.prev} size={20} label="previous" />
            </button>

            {/* Play / Pause */}
            <button
                className="vc-ytm-btn vc-ytm-btn-xl vc-ytm-play"
                onClick={() => YTMStore.playPause()}
                title={isPlaying ? "Pause" : "Play"}
            >
                <Icon d={isPlaying ? IC.pause : IC.play} size={20} label={isPlaying ? "pause" : "play"} />
            </button>

            {/* Next */}
            <button className="vc-ytm-btn vc-ytm-btn-md" onClick={() => YTMStore.next()} title="Next">
                <Icon d={IC.next} size={20} label="next" />
            </button>

            {/* Repeat */}
            <button
                className={classes("vc-ytm-btn vc-ytm-btn-sm", repeatMode !== "none" ? "vc-ytm-on" : "")}
                onClick={() => YTMStore.toggleRepeat()}
                title={`Repeat: ${repeatMode}`}
            >
                <Icon d={repeatMode === "one" ? IC.repeatOne : IC.repeatAll} size={16} label="repeat" />
            </button>
        </div>
    );
}

// ─── Master Player Component ──────────────────────────────────────────────────

export function Player() {
    const [authStage, statusText, track, isPlaying] = useStateFromStores(
        [YTMStore],
        () => [YTMStore.authStage, YTMStore.statusText, YTMStore.track, YTMStore.isPlaying] as const,
    );

    // Auto-idle: hide player card after 5 minutes of paused state
    const [hidden, setHidden] = useState(false);
    useEffect(() => {
        setHidden(false);
        if (!isPlaying) {
            const t = setTimeout(() => setHidden(true), 5 * 60_000);
            return () => clearTimeout(t);
        }
    }, [isPlaying]);

    if (hidden) return null;

    // ── Status & Pairing Prompt ───────────────────────────────────────────────
    if (authStage !== "connected" || !track) {
        const dotted = authStage !== "error";
        return (
            <div id="vc-ytm-player" className="vc-ytm-status">
                {dotted && <span className="vc-ytm-status-dot" />}
                <span className="vc-ytm-status-text">
                    {statusText || "YouTube Music: waiting for companion server..."}
                </span>
            </div>
        );
    }

    // ── Connected Player Card ─────────────────────────────────────────────────
    return (
        <div
            id="vc-ytm-player"
            style={
                {
                    "--vc-ytm-thumb": track.thumbnail ? `url(${track.thumbnail})` : "none",
                } as React.CSSProperties
            }
        >
            {/* Top row: Artwork + Metadata + Action Buttons */}
            <div className="vc-ytm-top">
                {track.thumbnail ? (
                    <img
                        className="vc-ytm-art"
                        src={track.thumbnail}
                        alt={track.title}
                        onClick={() => YTMStore.openInBrowser()}
                        title="Open in YouTube Music"
                    />
                ) : (
                    <div className="vc-ytm-art-placeholder">♪</div>
                )}

                <div className="vc-ytm-info">
                    <p
                        className="vc-ytm-title"
                        title={track.title}
                        onClick={() => YTMStore.openInBrowser()}
                    >
                        {track.title}
                    </p>
                    {(track.artist || track.album) && (
                        <p className="vc-ytm-sub">
                            {track.artist}
                            {track.artist && track.album && (
                                <span className="vc-ytm-album"> · {track.album}</span>
                            )}
                        </p>
                    )}
                </div>

                <div className="vc-ytm-actions">
                    <button
                        className={classes("vc-ytm-btn vc-ytm-btn-xs", track.liked ? "vc-ytm-liked" : "")}
                        onClick={() => YTMStore.toggleLike()}
                        title={track.liked ? "Unlike" : "Like"}
                    >
                        <Icon d={IC.thumbUp} size={15} label="like" />
                    </button>

                    <button
                        className={classes(
                            "vc-ytm-btn vc-ytm-btn-xs",
                            track.disliked ? "vc-ytm-disliked" : "",
                        )}
                        onClick={() => YTMStore.toggleDislike()}
                        title={track.disliked ? "Remove dislike" : "Dislike"}
                    >
                        <Icon d={IC.thumbDown} size={15} label="dislike" />
                    </button>

                    <button
                        className="vc-ytm-btn vc-ytm-btn-xs"
                        onClick={() => YTMStore.openInBrowser()}
                        title="Open in YouTube Music"
                    >
                        <Icon d={IC.openExt} size={13} label="open" />
                    </button>
                </div>
            </div>

            {/* Scrubber Seek Bar */}
            <SeekBar />

            {/* Playback Controls */}
            <Controls />

            {/* Volume Row */}
            <VolumeSlider />
        </div>
    );
}
