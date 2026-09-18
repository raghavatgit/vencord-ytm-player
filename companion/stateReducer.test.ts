import { playerReducer, initialState, PlayerState } from "./stateReducer";

describe("playerReducer", () => {
  it("plays track and updates playing status", () => {
    const next = playerReducer(initialState, { type: "PLAY_TRACK", trackId: "track_123" });
    expect(next.currentTrackId).toBe("track_123");
    expect(next.isPlaying).toBe(true);
  });

  it("clamps volume bounds between 0.0 and 1.0", () => {
    const clampedHigh = playerReducer(initialState, { type: "SET_VOLUME", volume: 1.5 });
    expect(clampedHigh.volume).toBe(1.0);

    const clampedLow = playerReducer(initialState, { type: "SET_VOLUME", volume: -0.5 });
    expect(clampedLow.volume).toBe(0.0);
  });

  it("advances queue properly on NEXT_TRACK", () => {
    const populated: PlayerState = {
      ...initialState,
      currentTrackId: "curr",
      queue: ["next_1", "next_2"]
    };

    const next = playerReducer(populated, { type: "NEXT_TRACK" });
    expect(next.currentTrackId).toBe("next_1");
    expect(next.queue).toEqual(["next_2"]);
  });
});
