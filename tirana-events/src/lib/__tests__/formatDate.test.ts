import { formatDate, formatTime } from '@/lib/format';

describe('formatDate', () => {
  // Monday 23 Nov 2026, 10:05 local time
  const d = new Date(2026, 10, 23, 10, 5);

  it('writes Albanian day and month names without relying on Intl', () => {
    expect(formatDate(d, 'sq')).toBe('E hënë, 23 nën');
    expect(formatDate(d, 'sq', true)).toBe('Hën, 23 nën');
  });

  it('writes English the en-GB way', () => {
    expect(formatDate(d, 'en')).toBe('Monday, 23 Nov');
    expect(formatDate(d, 'en', true)).toBe('Mon, 23 Nov');
  });

  it('uses a 24-hour clock', () => {
    expect(formatTime(d)).toBe('10:05');
    expect(formatTime(new Date(2026, 10, 23, 21, 30))).toBe('21:30');
  });
});
