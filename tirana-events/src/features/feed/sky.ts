/**
 * How "late" a moment feels, 0 (morning) → 1 (late night). Drives the feed's sky:
 * the background drifts from the theme's day colours to its evening colours as you
 * scroll from today's early events to the late ones.
 */
export function latenessOf(date: Date): number {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h < 5) return 1; // after midnight still counts as the night before
  return Math.min(1, Math.max(0, (h - 8) / 14)); // 08:00 → 0, 22:00 → 1
}

export interface SkyStop {
  /** scroll offset at which the sky should show `lateness` */
  at: number;
  lateness: number;
}

/**
 * Builds the scroll → lateness curve. At the top the sky matches the time right now;
 * it then follows each of today's events as it crosses the middle of the screen, and
 * eases back to "now" after the last one (tomorrow's list is not tonight).
 * Returns strictly increasing offsets, as Animated.interpolate requires.
 */
export function skyStops(nowLateness: number, rows: { center: number; lateness: number }[], viewportH: number): SkyStop[] {
  const stops: SkyStop[] = [{ at: 0, lateness: nowLateness }];
  for (const r of [...rows].sort((a, b) => a.center - b.center)) {
    const at = r.center - viewportH / 2;
    if (at > stops[stops.length - 1].at) stops.push({ at, lateness: Math.max(nowLateness, r.lateness) });
  }
  const last = stops[stops.length - 1].at;
  stops.push({ at: last + Math.max(240, viewportH * 0.6), lateness: nowLateness });
  return stops;
}
