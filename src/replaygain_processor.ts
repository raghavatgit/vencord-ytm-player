/**
 * ReplayGain 2.0 Loudness Processor and Peak Limiter
 * Provides automated gain adjustment based on ITU-R BS.1770-4 standards.
 */

export interface ReplayGainConfig {
  targetLoudnessDb: number; // typically -14 to -18 LUFS / dB
  preampDb: number;
  preventClipping: boolean;
}

export class ReplayGainProcessor {
  private config: ReplayGainConfig;

  constructor(config?: Partial<ReplayGainConfig>) {
    this.config = {
      targetLoudnessDb: -14.0,
      preampDb: 0.0,
      preventClipping: true,
      ...config,
    };
  }

  /**
   * Calculates linear gain multiplier from track trackGainDb and peak amplitude.
   */
  public calculateGain(trackGainDb: number, peakAmplitude = 1.0): number {
    const rawGainDb = trackGainDb + this.config.preampDb;
    let linearGain = Math.pow(10, rawGainDb / 20);

    if (this.config.preventClipping && peakAmplitude > 0) {
      const maxPermissibleGain = 1.0 / peakAmplitude;
      if (linearGain > maxPermissibleGain) {
        linearGain = maxPermissibleGain;
      }
    }

    return Math.max(0.0, Math.min(linearGain, 3.98)); // Clamp at ~+12 dB ceiling
  }

  /**
   * Applies smoothing transition to prevent audio pops/clicks when track switches.
   */
  public smoothRamp(
    gainNode: GainNode,
    targetGain: number,
    rampTimeSeconds = 0.05
  ): void {
    const ctx = gainNode.context;
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(targetGain, now + rampTimeSeconds);
  }
}
