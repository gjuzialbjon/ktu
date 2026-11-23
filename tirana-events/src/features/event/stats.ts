import type { EventItem } from '@ktu/shared';
import type { HourForecast, Weather } from '@/features/weather/weather';

/**
 * The numbers an event page leads with, like a route's stats card ("3h 29m", "7.7 km"):
 * how long it lasts and the evening step by step. Pure, so they are testable.
 */

/** Minutes the event lasts: from its end time, or else from its last program stop; unknown otherwise. */
export function durationMin(e: EventItem): number | undefined {
  if (e.endsAt) {
    const m = Math.round((new Date(e.endsAt).getTime() - new Date(e.startsAt).getTime()) / 60_000);
    if (m > 0) return m;
  }
  const last = e.program?.[e.program.length - 1];
  return last && last.min > 0 ? last.min : undefined;
}

/** 150 → "2h 30m", 120 → "2h", 45 → "45m". The same in both languages, like a route app. */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export interface Stop {
  /** "A" where you meet, "1", "2"… along the way, "B" how it ends */
  mark: string;
  at: Date;
  /** minutes after the start, for when the exact time is still hidden */
  min: number;
  text: string;
}

/** The program as waypoints. One stop is just "A"; two or more end with "B". */
export function programStops(e: EventItem): Stop[] {
  const program = e.program ?? [];
  const start = new Date(e.startsAt).getTime();
  return program.map((p, i) => ({
    mark: i === 0 ? 'A' : i === program.length - 1 ? 'B' : String(i),
    at: new Date(start + p.min * 60_000),
    min: p.min,
    text: p.text,
  }));
}

/**
 * The forecast for the hour the event starts, if it is inside the forecast window
 * (the next ~12 hours). Events further away get nothing rather than a guess.
 */
export function weatherAt(w: Weather, iso: string, now: Date): HourForecast | undefined {
  const t = new Date(iso);
  const ahead = t.getTime() - now.getTime();
  if (ahead < 0 || ahead > 12 * 3600_000) return undefined;
  const hh = `${String(t.getHours()).padStart(2, '0')}:00`;
  return w.hours.find((h) => h.time === hh);
}
