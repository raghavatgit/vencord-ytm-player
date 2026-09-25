// 10-Band Graphic Equalizer Engine
// Constructs a chained cascade of peaking and shelving BiquadFilterNodes.

export class GraphicEqualizer {
    private filters: BiquadFilterNode[] = [];
    private frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

    constructor(audioContext: AudioContext) {
        this.frequencies.forEach((freq, index) => {
            const filter = audioContext.createBiquadFilter();
            if (index === 0) {
                filter.type = 'lowshelf';
            } else if (index === this.frequencies.length - 1) {
                filter.type = 'highshelf';
            } else {
                filter.type = 'peaking';
                filter.Q.value = 1.414;
            }
            filter.frequency.value = freq;
            filter.gain.value = 0; // Neutral 0 dB
            this.filters.push(filter);
        });

        // Chain filters in series
        for (let i = 0; i < this.filters.length - 1; i++) {
            this.filters[i].connect(this.filters[i + 1]);
        }
    }

    public getInputNode(): BiquadFilterNode {
        return this.filters[0];
    }

    public getOutputNode(): BiquadFilterNode {
        return this.filters[this.filters.length - 1];
    }

    public setBandGain(bandIndex: number, gainDb: number): void {
        if (bandIndex >= 0 && bandIndex < this.filters.length) {
            this.filters[bandIndex].gain.value = Math.max(-12, Math.min(12, gainDb));
        }
    }
}
