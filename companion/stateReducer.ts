/**
 * Immutable State Reducer
 * Pure reducer managing player state transitions, playback queue, and repeat modes.
 */

export interface PlayerState {
  currentTrackId: string | null;
  isPlaying: boolean;
  volume: number;
  repeatMode: "off" | "one" | "all";
  queue: string[];
}

export type PlayerAction =
  | { type: "PLAY_TRACK"; trackId: string }
  | { type: "TOGGLE_PLAY" }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "SET_REPEAT"; mode: "off" | "one" | "all" }
  | { type: "ENQUEUE"; trackId: string }
  | { type: "NEXT_TRACK" };

export const initialState: PlayerState = {
  currentTrackId: null,
  isPlaying: false,
  volume: 0.8,
  repeatMode: "off",
  queue: []
};

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "PLAY_TRACK":
      return {
        ...state,
        currentTrackId: action.trackId,
        isPlaying: true
      };

    case "TOGGLE_PLAY":
      return {
        ...state,
        isPlaying: !state.isPlaying
      };

    case "SET_VOLUME":
      return {
        ...state,
        volume: Math.max(0, Math.min(1, action.volume))
      };

    case "SET_REPEAT":
      return {
        ...state,
        repeatMode: action.mode
      };

    case "ENQUEUE":
      return {
        ...state,
        queue: [...state.queue, action.trackId]
      };

    case "NEXT_TRACK":
      if (state.queue.length === 0) {
        return state.repeatMode === "one" ? state : { ...state, currentTrackId: null, isPlaying: false };
      }
      const [nextTrack, ...remainingQueue] = state.queue;
      return {
        ...state,
        currentTrackId: nextTrack,
        queue: state.repeatMode === "all" && state.currentTrackId ? [...remainingQueue, state.currentTrackId] : remainingQueue,
        isPlaying: true
      };

    default:
      return state;
  }
}
