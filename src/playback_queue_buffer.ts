/**
 * Playback Queue Ring Buffer
 * Thread-safe bounded queue maintaining playback history and forward track pipeline.
 */

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  thumbnailUrl?: string;
}

export class PlaybackQueueBuffer {
  private buffer: TrackMetadata[];
  private capacity: number;
  private currentIndex: number;

  constructor(capacity = 50) {
    this.capacity = capacity;
    this.buffer = [];
    this.currentIndex = -1;
  }

  public enqueue(track: TrackMetadata): void {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
      if (this.currentIndex > 0) {
        this.currentIndex--;
      }
    }
    this.buffer.push(track);
    if (this.currentIndex === -1) {
      this.currentIndex = 0;
    }
  }

  public current(): TrackMetadata | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.buffer.length) {
      return this.buffer[this.currentIndex];
    }
    return null;
  }

  public next(): TrackMetadata | null {
    if (this.currentIndex + 1 < this.buffer.length) {
      this.currentIndex++;
      return this.buffer[this.currentIndex];
    }
    return null;
  }

  public previous(): TrackMetadata | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.buffer[this.currentIndex];
    }
    return null;
  }

  public getHistory(): TrackMetadata[] {
    return this.buffer.slice(0, Math.max(0, this.currentIndex));
  }

  public getUpcoming(): TrackMetadata[] {
    return this.buffer.slice(this.currentIndex + 1);
  }

  public clear(): void {
    this.buffer = [];
    this.currentIndex = -1;
  }

  public size(): number {
    return this.buffer.length;
  }
}
