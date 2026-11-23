import { CITY_ORDER, CityId } from '@ktu/shared';
import { isThisWeek } from '@/lib/format';

/** Events this week per city, so the picker shows where things are happening. Every city gets a key. */
export function countThisWeekByCity(events: { city: CityId; startsAt: string }[], now: Date): Record<CityId, number> {
  const out = Object.fromEntries(CITY_ORDER.map((c) => [c, 0])) as Record<CityId, number>;
  for (const e of events) if (isThisWeek(e.startsAt, now)) out[e.city] += 1;
  return out;
}
