import { describe, it, expect, beforeEach } from "vitest";
import { PlaybackQueueBuffer, TrackMetadata } from "./playback_queue_buffer";

describe("PlaybackQueueBuffer", () => {
  let queue: PlaybackQueueBuffer;

  const mockTrack = (id: string): TrackMetadata => ({
    id,
    title: `Track ${id}`,
    artist: "Artist",
    durationSeconds: 180,
  });

  beforeEach(() => {
    queue = new PlaybackQueueBuffer(3);
  });

  it("enqueues tracks and maintains current pointer", () => {
    queue.enqueue(mockTrack("1"));
    expect(queue.current()?.id).toBe("1");
    queue.enqueue(mockTrack("2"));
    expect(queue.current()?.id).toBe("1");
  });

  it("navigates forward and backward cleanly", () => {
    queue.enqueue(mockTrack("1"));
    queue.enqueue(mockTrack("2"));
    queue.enqueue(mockTrack("3"));

    expect(queue.next()?.id).toBe("2");
    expect(queue.next()?.id).toBe("3");
    expect(queue.next()).toBeNull();

    expect(queue.previous()?.id).toBe("2");
    expect(queue.previous()?.id).toBe("1");
    expect(queue.previous()).toBeNull();
  });

  it("evicts oldest track when exceeding capacity", () => {
    queue.enqueue(mockTrack("1"));
    queue.enqueue(mockTrack("2"));
    queue.enqueue(mockTrack("3"));
    queue.enqueue(mockTrack("4"));

    expect(queue.size()).toBe(3);
    expect(queue.getUpcoming().map((t) => t.id)).toEqual(["3", "4"]);
  });
});
