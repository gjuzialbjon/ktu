import type { MapBounds } from '@/data/cities';

/**
 * Today's weather for the city, from Open-Meteo (free, no key, no personal data:
 * only the city's centre coordinates are sent). Pure parsing lives here so it is
 * testable; the fetch and caching live in useWeather.
 */
export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

export interface HourForecast {
  /** local city time, "HH:00" */
  time: string;
  temp: number;
  kind: WeatherKind;
  rainChance: number;
}

export interface Weather {
  temp: number;
  feelsLike: number;
  kind: WeatherKind;
  isDay: boolean;
  windKmh: number;
  high: number;
  low: number;
  rainChance: number;
  /** local "HH:MM" */
  sunrise: string;
  sunset: string;
  hours: HourForecast[];
}

/** WMO weather codes → the eight kinds we draw. https://open-meteo.com/en/docs */
export function kindOf(code: number): WeatherKind {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

export const WEATHER_EMOJI: Record<WeatherKind, string> = {
  clear: '☀️',
  partly: '⛅',
  cloudy: '☁️',
  fog: '🌫️',
  drizzle: '🌦️',
  rain: '🌧️',
  snow: '❄️',
  storm: '⛈️',
};
/** Clear sky after dark. */
export const NIGHT_EMOJI = '🌙';

export type WeatherTip = 'rain' | 'hot' | 'cold' | 'nice';

/** One line of advice: rain beats heat beats cold. */
export function tipFor(w: Weather): WeatherTip {
  if (w.rainChance >= 50 || w.kind === 'rain' || w.kind === 'storm' || w.kind === 'drizzle') return 'rain';
  if (w.high >= 30) return 'hot';
  if (w.high <= 8) return 'cold';
  return 'nice';
}

export function forecastUrl(b: MapBounds): string {
  const lat = ((b.latMin + b.latMax) / 2).toFixed(3);
  const lng = ((b.lngMin + b.lngMax) / 2).toFixed(3);
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day' +
    '&hourly=temperature_2m,weather_code,precipitation_probability' +
    '&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max' +
    '&timezone=auto&forecast_days=2'
  );
}

const hhmm = (iso: string) => iso.slice(11, 16);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Parses the API response; null when anything we need is missing (the chip then hides). */
export function parseForecast(raw: unknown, hoursAhead = 12): Weather | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, Record<string, unknown>>;
  const cur = r.current;
  const daily = r.daily as Record<string, unknown[]> | undefined;
  const hourly = r.hourly as Record<string, unknown[]> | undefined;
  if (!cur || !daily || !hourly) return null;

  const temp = num(cur.temperature_2m);
  const code = num(cur.weather_code);
  const curTime = typeof cur.time === 'string' ? cur.time : null;
  if (temp == null || code == null || !curTime) return null;

  const times = (hourly.time ?? []) as string[];
  const thisHour = curTime.slice(0, 13); // "YYYY-MM-DDTHH"
  const start = Math.max(0, times.findIndex((t) => t.slice(0, 13) === thisHour));
  const hours: HourForecast[] = [];
  for (let i = start + 1; i < times.length && hours.length < hoursAhead; i++) {
    const ht = num(hourly.temperature_2m?.[i]);
    const hc = num(hourly.weather_code?.[i]);
    if (ht == null || hc == null) continue;
    hours.push({ time: hhmm(times[i]), temp: Math.round(ht), kind: kindOf(hc), rainChance: num(hourly.precipitation_probability?.[i]) ?? 0 });
  }

  return {
    temp: Math.round(temp),
    feelsLike: Math.round(num(cur.apparent_temperature) ?? temp),
    kind: kindOf(code),
    isDay: cur.is_day !== 0,
    windKmh: Math.round(num(cur.wind_speed_10m) ?? 0),
    high: Math.round(num(daily.temperature_2m_max?.[0]) ?? temp),
    low: Math.round(num(daily.temperature_2m_min?.[0]) ?? temp),
    rainChance: num(daily.precipitation_probability_max?.[0]) ?? 0,
    sunrise: typeof daily.sunrise?.[0] === 'string' ? hhmm(daily.sunrise[0] as string) : '',
    sunset: typeof daily.sunset?.[0] === 'string' ? hhmm(daily.sunset[0] as string) : '',
    hours,
  };
}

export const weatherEmoji = (kind: WeatherKind, isDay: boolean) =>
  !isDay && kind === 'clear' ? NIGHT_EMOJI : WEATHER_EMOJI[kind];
