import { toPerceptualVolume, toLinearVolume } from './volumeNormalizer';

describe('volumeNormalizer', () => {
  it('preserves boundary zero and max volume', () => {
    expect(toPerceptualVolume(0)).toBe(0);
    expect(toPerceptualVolume(100)).toBe(100);
  });

  it('attenuates midpoint volume for human acoustic perception', () => {
    // 50% linear corresponds to 25% perceptual energy (0.5^2 = 0.25)
    expect(toPerceptualVolume(50)).toBe(25);
  });

  it('inverts perceptual volume back accurately', () => {
    expect(toLinearVolume(25)).toBe(50);
  });

  it('clamps out-of-bounds input values', () => {
    expect(toPerceptualVolume(-20)).toBe(0);
    expect(toPerceptualVolume(150)).toBe(100);
  });
});
