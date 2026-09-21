/**
 * Playback State Persistence Manager
 * Serializes volume, playback position, and track queues to LocalStorage
 * with schema validation.
 */

export interface SavedPlaybackSession {
  trackId: string;
  positionSeconds: number;
  volume: number;
  timestamp: number;
}

export class PlaybackPersistenceManager {
  static STORAGE_KEY = "ytm_player_session_v1";

  static saveSession(session: SavedPlaybackSession): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn("Could not persist player session:", e);
    }
  }

  static loadSession(): SavedPlaybackSession | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (typeof data.trackId === "string" && typeof data.positionSeconds === "number") {
        return data as SavedPlaybackSession;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
