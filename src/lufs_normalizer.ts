// ITU-R BS.1770 Perceived Loudness (LUFS) Normalizer
// Calculates target gain adjustments to equalize track volumes across heterogeneous audio sources.

export class LoudnessNormalizer {
    private targetLUFS: number;

    constructor(targetLUFS: number = -14.0) {
        this.targetLUFS = targetLUFS;
    }

    public calculateGainFactor(trackLUFS: number): number {
        const deltaLUFS = this.targetLUFS - trackLUFS;
        // Gain in decibels converted to linear amplitude multiplier
        const linearGain = Math.pow(10, deltaLUFS / 20.0);
        // Clamp gain between -12dB and +6dB to prevent clipping
        return Math.min(Math.max(linearGain, 0.25), 2.0);
    }

    public applyToGainNode(gainNode: GainNode, trackLUFS: number, audioContext: AudioContext): void {
        const targetGain = this.calculateGainFactor(trackLUFS);
        gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(targetGain, audioContext.currentTime + 0.3);
    }
}
