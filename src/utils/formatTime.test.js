import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('formats seconds with two decimals and an "s" suffix', () => {
    expect(formatTime(45.5)).toBe('45.50s');
    expect(formatTime(7)).toBe('7.00s');
  });

  it('renders "SAT" when the pass is marked SAT, ignoring the time', () => {
    expect(formatTime(120, true)).toBe('SAT');
  });
});
