import { formatPlaybackTime } from './timeFormatter';

describe('formatPlaybackTime', () => {
  it('formats zero seconds', () => {
    expect(formatPlaybackTime(0)).toBe('0:00');
  });

  it('formats standard minute-second track offsets', () => {
    expect(formatPlaybackTime(65)).toBe('1:05');
    expect(formatPlaybackTime(234)).toBe('3:54');
  });

  it('formats multi-hour durations with hour prefixes', () => {
    expect(formatPlaybackTime(3600)).toBe('1:00:00');
    expect(formatPlaybackTime(3665)).toBe('1:01:05');
  });

  it('handles negative numbers and NaN gracefully', () => {
    expect(formatPlaybackTime(-10)).toBe('0:00');
    expect(formatPlaybackTime(NaN)).toBe('0:00');
  });
});
