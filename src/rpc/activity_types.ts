export interface TrackMetadata {
  title: string;
  artist: string;
  album?: string;
  durationMs: number;
  currentPositionMs: number;
  albumArtUrl?: string;
  isPaused: boolean;
}
