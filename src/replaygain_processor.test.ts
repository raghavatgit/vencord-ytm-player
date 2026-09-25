import { describe, it, expect } from "vitest";
import { ReplayGainProcessor } from "./replaygain_processor";

describe("ReplayGainProcessor", () => {
  it("calculates unity gain when trackGainDb is zero", () => {
    const processor = new ReplayGainProcessor();
    const gain = processor.calculateGain(0.0, 0.5);
    expect(gain).toBeCloseTo(1.0, 4);
  });

  it("applies negative gain attenuation without clipping", () => {
    const processor = new ReplayGainProcessor();
    const gain = processor.calculateGain(-6.0, 0.9);
    // 10^(-6/20) approx 0.50118
    expect(gain).toBeCloseTo(0.5012, 3);
  });

  it("limits gain to prevent peak clipping above 1.0", () => {
    const processor = new ReplayGainProcessor({
      preventClipping: true,
      preampDb: 6.0,
    });
    // With peak at 0.8, max permissible gain is 1 / 0.8 = 1.25
    const gain = processor.calculateGain(6.0, 0.8);
    expect(gain).toBeLessThanOrEqual(1.25);
  });
});
