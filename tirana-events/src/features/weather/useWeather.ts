import { useEffect, useState } from 'react';
import { CITIES, CityId } from '@/data/cities';
import { createLogger } from '@/lib/log';
import { Weather, forecastUrl, parseForecast } from './weather';

const log = createLogger('weather');

/** Weather changes slowly: one request per city per half hour is plenty. */
const TTL_MS = 30 * 60_000;
const cache = new Map<CityId, { at: number; data: Weather }>();

export type WeatherState = { status: 'loading' } | { status: 'ok'; data: Weather } | { status: 'error' };

export function useWeather(city: CityId): WeatherState {
  // the latest answer from the network; anything cached shows meanwhile (even if a bit old)
  const [result, setResult] = useState<{ city: CityId; state: WeatherState } | null>(null);
  const cached = cache.get(city)?.data;

  useEffect(() => {
    const hit = cache.get(city);
    if (hit && Date.now() - hit.at < TTL_MS) return; // fresh enough: rendered from the cache
    let alive = true;
    fetch(forecastUrl(CITIES[city].bounds))
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((json) => {
        const data = parseForecast(json);
        if (!data) throw new Error('unexpected response');
        cache.set(city, { at: Date.now(), data });
        if (alive) setResult({ city, state: { status: 'ok', data } });
      })
      .catch((e) => {
        log.warn('forecast failed', { city, e: String(e) });
        if (alive) setResult({ city, state: { status: 'error' } });
      });
    return () => {
      alive = false;
    };
  }, [city]);

  if (result?.city === city && (result.state.status === 'ok' || !cached)) return result.state;
  return cached ? { status: 'ok', data: cached } : { status: 'loading' };
}
