/**
 * Web Audio Parametric Equalizer
 * Cascades 5-band BiquadFilterNodes (lowshelf, 3 peaking, highshelf)
 * for custom audio equalization curves.
 */

export interface EQBandConfig {
  frequency: number;
  type: BiquadFilterType;
  gain: number;
  q?: number;
}

export class ParametricEqualizer {
  private filters: BiquadFilterNode[] = [];

  constructor(private audioContext: AudioContext, bands: EQBandConfig[]) {
    this.initFilters(bands);
  }

  private initFilters(bands: EQBandConfig[]): void {
    this.filters = bands.map((config) => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = config.type;
      filter.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);
      filter.gain.setValueAtTime(config.gain, this.audioContext.currentTime);
      if (config.q !== undefined && filter.Q) {
        filter.Q.setValueAtTime(config.q, this.audioContext.currentTime);
      }
      return filter;
    });

    // Chain filters in series
    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i + 1]);
    }
  }

  public setGain(bandIndex: number, gainDb: number): void {
    if (bandIndex >= 0 && bandIndex < this.filters.length) {
      const clamped = Math.max(-12, Math.min(12, gainDb));
      this.filters[bandIndex].gain.setTargetAtTime(clamped, this.audioContext.currentTime, 0.02);
    }
  }

  public getInputNode(): AudioNode {
    return this.filters[0];
  }

  public getOutputNode(): AudioNode {
    return this.filters[this.filters.length - 1];
  }
}
