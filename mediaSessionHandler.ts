/**
 * Chromium MediaSession API Integration
 * Binds YouTube Music playback state to OS hardware media keys and notification controls.
 */

export interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  artworkUrl?: string;
}

export class MediaSessionHandler {
  constructor(private callbacks: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek: (offsetSeconds: number) => void;
  }) {
    this.registerActionHandlers();
  }

  public updateMetadata(track: TrackMetadata): void {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    const artwork: MediaImage[] = [];
    if (track.artworkUrl) {
      artwork.push({
        src: track.artworkUrl,
        sizes: "512x512",
        type: "image/jpeg"
      });
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork
    });
  }

  public setPlaybackState(state: "playing" | "paused" | "none"): void {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = state;
  }

  private registerActionHandlers(): void {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", () => this.callbacks.onPlay());
    navigator.mediaSession.setActionHandler("pause", () => this.callbacks.onPause());
    navigator.mediaSession.setActionHandler("nexttrack", () => this.callbacks.onNext());
    navigator.mediaSession.setActionHandler("previoustrack", () => this.callbacks.onPrev());
    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      this.callbacks.onSeek(details.seekOffset || 10);
    });
    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      this.callbacks.onSeek(-(details.seekOffset || 10));
    });
  }
}
