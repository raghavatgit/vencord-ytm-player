import { PlaybackPersistenceManager } from "./playbackPersistence";

describe("PlaybackPersistenceManager", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists and restores valid playback session state", () => {
    const session = {
      trackId: "track_abc",
      positionSeconds: 45.2,
      volume: 0.8,
      timestamp: Date.now(),
    };

    PlaybackPersistenceManager.saveSession(session);
    const loaded = PlaybackPersistenceManager.loadSession();

    expect(loaded).not.toBeNull();
    expect(loaded?.trackId).toBe("track_abc");
    expect(loaded?.positionSeconds).toBe(45.2);
  });
});
