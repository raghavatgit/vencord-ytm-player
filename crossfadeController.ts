/**
 * Equal-Power Audio Crossfade Controller
 * Generates trigonometric equal-power fade curves (sin/cos)
 * ensuring acoustic energy remains constant during track transitions.
 */

export class CrossfadeController {
  constructor(private audioContext: AudioContext, private crossfadeDurationSeconds: number = 3.0) {}

  public executeCrossfade(outgoingGain: GainNode, incomingGain: GainNode): Promise<void> {
    return new Promise((resolve) => {
      const now = this.audioContext.currentTime;
      const duration = this.crossfadeDurationSeconds;

      // Equal power curve points
      const points = 20;
      const outgoingCurve = new Float32Array(points);
      const incomingCurve = new Float32Array(points);

      for (let i = 0; i < points; i++) {
        const x = i / (points - 1);
        outgoingCurve[i] = Math.cos((x * 0.5) * Math.PI);
        incomingCurve[i] = Math.sin((x * 0.5) * Math.PI);
      }

      outgoingGain.gain.setValueCurveAtTime(outgoingCurve, now, duration);
      incomingGain.gain.setValueCurveAtTime(incomingCurve, now, duration);

      window.setTimeout(() => {
        outgoingGain.gain.setValueAtTime(0, now + duration);
        incomingGain.gain.setValueAtTime(1, now + duration);
        resolve();
      }, duration * 1000);
    });
  }
}
