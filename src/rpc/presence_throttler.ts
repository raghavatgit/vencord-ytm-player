export class PresenceThrottler {
  private lastUpdateMs = 0;
  private minIntervalMs: number;

  constructor(minIntervalMs = 4000) {
    this.minIntervalMs = minIntervalMs;
  }

  public shouldUpdate(): boolean {
    const now = Date.now();
    if (now - this.lastUpdateMs >= this.minIntervalMs) {
      this.lastUpdateMs = now;
      return true;
    }
    return false;
  }
}
