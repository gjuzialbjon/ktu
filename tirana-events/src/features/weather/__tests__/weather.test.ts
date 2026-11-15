import { kindOf, parseForecast, tipFor, weatherEmoji } from '../weather';

const sample = {
  current: { time: '2026-11-15T20:15', temperature_2m: 15.3, apparent_temperature: 14.6, weather_code: 61, wind_speed_10m: 8.5, is_day: 0 },
  hourly: {
    time: ['2026-11-15T19:00', '2026-11-15T20:00', '2026-11-15T21:00', '2026-11-15T22:00'],
    temperature_2m: [16, 15.4, 14.6, 14.1],
    weather_code: [3, 61, 63, 2],
    precipitation_probability: [10, 70, 80, 20],
  },
  daily: {
    temperature_2m_max: [18.2],
    temperature_2m_min: [9.6],
    sunrise: ['2026-11-15T06:47'],
    sunset: ['2026-11-15T16:21'],
    precipitation_probability_max: [80],
  },
};

describe('kindOf', () => {
  it.each([
    [0, 'clear'],
    [2, 'partly'],
    [3, 'cloudy'],
    [45, 'fog'],
    [53, 'drizzle'],
    [63, 'rain'],
    [81, 'rain'],
    [73, 'snow'],
    [95, 'storm'],
  ])('code %i is %s', (code, kind) => expect(kindOf(code)).toBe(kind));
});

describe('parseForecast', () => {
  it('reads now, the day and the hours after this one', () => {
    const w = parseForecast(sample)!;
    expect(w).toMatchObject({ temp: 15, feelsLike: 15, kind: 'rain', isDay: false, high: 18, low: 10, sunrise: '06:47', sunset: '16:21' });
    expect(w.hours.map((h) => h.time)).toEqual(['21:00', '22:00']);
  });
  it('returns null for junk instead of throwing', () => {
    expect(parseForecast(null)).toBeNull();
    expect(parseForecast({ current: {} })).toBeNull();
  });
});

describe('tipFor / weatherEmoji', () => {
  it('rain beats everything', () => {
    expect(tipFor(parseForecast(sample)!)).toBe('rain');
  });
  it('shows a moon for a clear night', () => {
    expect(weatherEmoji('clear', false)).toBe('🌙');
    expect(weatherEmoji('clear', true)).toBe('☀️');
  });
});
