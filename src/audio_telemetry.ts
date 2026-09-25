// Audio Telemetry Reporter
// Tracks buffer underflows, decode latencies, and dropped audio samples.

export class AudioTelemetryReporter {
    private underflowCount: number = 0;
    private totalBufferLatencyMs: number = 0;

    public recordUnderflow(): void {
        this.underflowCount++;
        console.warn(`[AudioTelemetry] Buffer underflow event #${this.underflowCount}`);
    }

    public recordDecodeTime(latencyMs: number): void {
        this.totalBufferLatencyMs += latencyMs;
    }

    public getMetrics(): { underflows: number; averageLatencyMs: number } {
        return {
            underflows: this.underflowCount,
            averageLatencyMs: this.totalBufferLatencyMs
        };
    }
}
