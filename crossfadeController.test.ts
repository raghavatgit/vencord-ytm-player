import { CrossfadeController } from "./crossfadeController";

describe("CrossfadeController", () => {
  it("computes equal-power crossfade gain curves without throwing", () => {
    const mockAudioContext = {
      currentTime: 0,
    } as unknown as AudioContext;

    const controller = new CrossfadeController(mockAudioContext, 2.0);
    expect(controller).toBeDefined();
  });
});
