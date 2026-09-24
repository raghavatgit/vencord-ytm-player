// Web Audio Playback Speed with Detune Compensation
// Maintains harmonic key when accelerating or decelerating playback rates.

export class PitchCompensatedPlayback {
    public static setPlaybackRate(
        source: AudioBufferSourceNode,
        rate: number,
        preservePitch: boolean = true
    ): void {
        source.playbackRate.value = rate;

        if (preservePitch) {
            // Pitch shift in cents: -1200 * log2(rate)
            const cents = -1200 * Math.log2(rate);
            if (source.detune) {
                source.detune.value = cents;
            }
        } else {
            if (source.detune) {
                source.detune.value = 0;
            }
        }
    }
}
