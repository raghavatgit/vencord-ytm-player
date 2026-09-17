/**
 * Resilient Companion WebSocket Client
 * Features exponential backoff reconnects, heartbeat ping/pong,
 * and offline event queuing for the YouTube Music desktop player.
 */

export interface SocketConfig {
  url: string;
  maxReconnectAttempts?: number;
  baseBackoffMs?: number;
  heartbeatIntervalMs?: number;
}

export class ResilientSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts: number;
  private readonly baseBackoffMs: number;
  private readonly heartbeatIntervalMs: number;
  private heartbeatTimer: number | null = null;
  private messageQueue: string[] = [];

  constructor(private config: SocketConfig) {
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 10;
    this.baseBackoffMs = config.baseBackoffMs ?? 1000;
    this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 15000;
  }

  public connect(): void {
    try {
      this.ws = new WebSocket(this.config.url);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.flushQueue();
  }

  private handleClose(): void {
    this.stopHeartbeat();
    this.scheduleReconnect();
  }

  private handleError(): void {
    if (this.ws) {
      this.ws.close();
    }
  }

  private handleMessage(event: MessageEvent): void {
    if (event.data === "pong") return;
    // Process companion payload
  }

  public send(payload: object | string): void {
    const message = typeof payload === "string" ? payload : JSON.stringify(payload);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg = this.messageQueue.shift();
      if (msg) this.ws.send(msg);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(30000, this.baseBackoffMs * Math.pow(2, this.reconnectAttempts) + Math.random() * 500);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }
}
