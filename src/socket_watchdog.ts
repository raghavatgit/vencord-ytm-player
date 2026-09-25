/**
 * WebSocket Heartbeat Watchdog
 * Monitored WebSocket wrapper ensuring high-availability companion bridge connectivity.
 */

export interface WatchdogOptions {
  heartbeatIntervalMs: number;
  missedHeartbeatThreshold: number;
  baseReconnectDelayMs: number;
  maxReconnectDelayMs: number;
}

export class SocketWatchdog {
  private socket: WebSocket | null = null;
  private missedPings = 0;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private url: string;
  private options: WatchdogOptions;

  constructor(url: string, options?: Partial<WatchdogOptions>) {
    this.url = url;
    this.options = {
      heartbeatIntervalMs: 5000,
      missedHeartbeatThreshold: 3,
      baseReconnectDelayMs: 1000,
      maxReconnectDelayMs: 30000,
      ...options,
    };
  }

  public connect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.socket = new WebSocket(this.url);
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleClose.bind(this);
    } catch {
      this.scheduleReconnect();
    }
  }

  private handleOpen(): void {
    this.missedPings = 0;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent): void {
    if (event.data === "pong" || event.data === '{"type":"pong"}') {
      this.missedPings = 0;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.missedPings >= this.options.missedHeartbeatThreshold) {
        this.forceReconnect();
        return;
      }
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
        this.missedPings++;
      }
    }, this.options.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private forceReconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.scheduleReconnect();
  }

  private handleClose(): void {
    this.stopHeartbeat();
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const delay = Math.min(
      this.options.baseReconnectDelayMs * Math.pow(1.5, this.reconnectAttempts),
      this.options.maxReconnectDelayMs
    );
    // Decorrelated jitter: +/- 20%
    const jitter = delay * (0.8 + Math.random() * 0.4);

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, jitter);
  }

  public disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
