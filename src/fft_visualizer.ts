// Web Audio FFT Visualizer Processor
// Extracts decibel frequency bands for real-time canvas visualizers.

export class AudioSpectrumVisualizer {
    private analyser: AnalyserNode;
    private frequencyData: Uint8Array;

    constructor(audioContext: AudioContext, fftSize: number = 256) {
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = fftSize;
        this.analyser.smoothingTimeConstant = 0.85;
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    public connectSource(sourceNode: AudioNode): void {
        sourceNode.connect(this.analyser);
    }

    public getFrequencyData(): Uint8Array {
        this.analyser.getByteFrequencyData(this.frequencyData);
        return this.frequencyData;
    }

    public getAverageEnergy(): number {
        this.getFrequencyData();
        const sum = this.frequencyData.reduce((acc, val) => acc + val, 0);
        return sum / this.frequencyData.length;
    }
}
