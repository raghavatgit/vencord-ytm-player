// vencord-ytm-player - Biquad Peaking Filter
// Parametric equalization for YouTube Music stream enhancement

export class BiquadPeakingFilter {
  public static calculateCoefficients(centerFreq: number, sampleRate: number, q: number, gainDb: number) {
    const w0 = 2 * Math.PI * (centerFreq / sampleRate);
    const alpha = Math.sin(w0) / (2 * q);
    const A = Math.pow(10, gainDb / 40);

    const b0 = 1 + alpha * A;
    const b1 = -2 * Math.cos(w0);
    const b2 = 1 - alpha * A;
    const a0 = 1 + alpha / A;
    const a1 = -2 * Math.cos(w0);
    const a2 = 1 - alpha / A;

    return {
      b0: b0 / a0,
      b1: b1 / a0,
      b2: b2 / a0,
      a1: a1 / a0,
      a2: a2 / a0
    };
  }
}
