// vencord-ytm-player - Dynamic Range Compressor
// Prevents harsh decibel jumps between heterogeneous audio sources

export interface CompressorConfig {
  thresholdDb: number; // e.g. -24 dB
  ratio: number;       // e.g. 4.0
  attackMs: number;    // e.g. 5 ms
  releaseMs: number;   // e.g. 50 ms
}

export class DynamicRangeCompressor {
  private config: CompressorConfig;

  constructor(config: CompressorConfig) {
    this.config = config;
  }

  public computeGainReduction(inputDb: number): number {
    if (inputDb <= this.config.thresholdDb) {
      return 0.0; // Linear gain
    }
    const overshoot = inputDb - this.config.thresholdDb;
    return overshoot * (1.0 - 1.0 / this.config.ratio);
  }
}
