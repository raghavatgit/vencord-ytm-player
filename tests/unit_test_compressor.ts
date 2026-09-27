import { DynamicRangeCompressor } from '../src/dsp/dynamic_range_compressor';

export function testCompressor() {
  const comp = new DynamicRangeCompressor({
    thresholdDb: -20,
    ratio: 4.0,
    attackMs: 5,
    releaseMs: 50,
  });

  const below = comp.computeGainReduction(-25);
  console.assert(below === 0.0, "Gain reduction should be 0 below threshold");

  const above = comp.computeGainReduction(-10);
  console.assert(above > 0.0, "Gain reduction should be positive above threshold");
}
