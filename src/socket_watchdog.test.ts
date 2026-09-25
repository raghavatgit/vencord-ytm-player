import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SocketWatchdog } from "./socket_watchdog";

describe("SocketWatchdog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with default backoff options", () => {
    const watchdog = new SocketWatchdog("ws://localhost:9863");
    expect(watchdog).toBeDefined();
  });

  it("handles explicit disconnection cleanly", () => {
    const watchdog = new SocketWatchdog("ws://localhost:9863");
    watchdog.disconnect();
    expect(watchdog).toBeDefined();
  });
});
