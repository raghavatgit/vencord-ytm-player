// Logarithmic Volume Attenuation Curve
// Maps linear slider values (0.0 - 1.0) to logarithmic decibel gain for human hearing perception.

export class LogarithmicVolume {
    public static linearToLogGain(linearValue: number): number {
        if (linearValue <= 0.0) return 0.0;
        if (linearValue >= 1.0) return 1.0;
        // Human perception formula: 10^(2 * (value - 1))
        return Math.pow(10, 2 * (linearValue - 1));
    }

    public static applyVolume(gainNode: GainNode, linearValue: number, audioContext: AudioContext): void {
        const gain = this.linearToLogGain(linearValue);
        gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
    }
}
