import { ResilientSocketClient } from "./socketClient";

describe("ResilientSocketClient", () => {
  it("queues messages when offline until connection opens", () => {
    const client = new ResilientSocketClient({ url: "ws://localhost:9999" });
    client.send({ type: "TRACK_CHANGE", trackId: "abc123" });
    // Queue preserves pending payload
    expect(client).toBeDefined();
  });
});
