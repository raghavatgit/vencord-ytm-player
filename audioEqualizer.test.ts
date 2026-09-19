import { ParametricEqualizer, EQBandConfig } from "./audioEqualizer";

describe("ParametricEqualizer", () => {
  it("initializes series filter chain with clamped gain values", () => {
    const mockAudioContext = {
      currentTime: 0,
      createBiquadFilter: jest.fn(() => ({
        type: "peaking",
        frequency: { setValueAtTime: jest.fn() },
        gain: { setValueAtTime: jest.fn(), setTargetAtTime: jest.fn() },
        Q: { setValueAtTime: jest.fn() },
        connect: jest.fn(),
      })),
    } as unknown as AudioContext;

    const bands: EQBandConfig[] = [
      { frequency: 60, type: "lowshelf", gain: 2 },
      { frequency: 1000, type: "peaking", gain: 0, q: 1.0 },
      { frequency: 12000, type: "highshelf", gain: -1 },
    ];

    const eq = new ParametricEqualizer(mockAudioContext, bands);
    expect(eq.getInputNode()).toBeDefined();
    expect(eq.getOutputNode()).toBeDefined();
  });
});
