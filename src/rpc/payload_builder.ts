export interface RPCActivity {
  details: string;
  state: string;
  startTimestamp: number;
  endTimestamp?: number;
  largeImageKey: string;
  largeImageText: string;
}

export function buildActivityPayload(title: string, artist: string, startMs: number, endMs?: number): RPCActivity {
  return {
    details: title,
    state: artist,
    startTimestamp: Math.floor(startMs / 1000),
    endTimestamp: endMs ? Math.floor(endMs / 1000) : undefined,
    largeImageKey: "ytm_logo",
    largeImageText: "YouTube Music",
  };
}
