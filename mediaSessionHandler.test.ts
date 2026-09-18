import { MediaSessionHandler } from "./mediaSessionHandler";

describe("MediaSessionHandler", () => {
  it("initializes action handlers cleanly without throwing", () => {
    const handler = new MediaSessionHandler({
      onPlay: jest.fn(),
      onPause: jest.fn(),
      onNext: jest.fn(),
      onPrev: jest.fn(),
      onSeek: jest.fn(),
    });

    expect(handler).toBeDefined();
  });
});
