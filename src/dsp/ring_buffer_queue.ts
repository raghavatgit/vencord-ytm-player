export class RingBufferQueue {
  private buffer: Float32Array;
  private writeIndex = 0;
  private readIndex = 0;

  constructor(size = 4096) {
    this.buffer = new Float32Array(size);
  }

  public write(samples: Float32Array): void {
    for (let i = 0; i < samples.length; i++) {
      this.buffer[this.writeIndex] = samples[i];
      this.writeIndex = (this.writeIndex + 1) % this.buffer.length;
    }
  }
}
