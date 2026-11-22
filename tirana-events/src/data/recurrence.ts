import type { EventItem, Repeat, Series } from './types';

/**
 * Recurring events. Pure: callers pass `now`.
 *
 * Every edition is a separate event, so people join, comment and like one evening at a time.
 * The next edition exists as soon as the latest one has started (that is when people start
 * asking "is there one next week?"). It is derived from the latest edition rather than stored,
 * so it can never be duplicated or drift; a backend would create it as a row at the same moment.
 */

export const REPEATS: Repeat[] = ['weekly', 'biweekly', 'monthly'];

export const editionTitle = (base: string, edition: number) => `${base} #${edition}`;

/** The same local time, one step later. Monthly keeps the day, or the month's last day (31 Jan → 28 Feb). */
export function nextDate(iso: string, repeat: Repeat): Date {
  const d = new Date(iso);
  if (repeat === 'monthly') {
    const day = d.getDate();
    const n = new Date(d);
    n.setDate(1);
    n.setMonth(n.getMonth() + 1);
    const last = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
    n.setDate(Math.min(day, last));
    return n;
  }
  const n = new Date(d);
  n.setDate(n.getDate() + (repeat === 'weekly' ? 7 : 14));
  return n;
}

/** First edition of a new series: its title gets "#1". */
export function startSeries(id: string, title: string, repeat: Repeat): { title: string; series: Series } {
  return { title: editionTitle(title, 1), series: { id, repeat, edition: 1, baseTitle: title } };
}

/** The latest edition of every series among `events`. */
function latestEditions(events: EventItem[]): EventItem[] {
  const latest = new Map<string, EventItem>();
  for (const e of events) {
    if (!e.series) continue;
    const cur = latest.get(e.series.id);
    if (!cur || e.series.edition > cur.series!.edition) latest.set(e.series.id, e);
  }
  return [...latest.values()];
}

/**
 * The editions that should exist now but do not: for each series whose latest edition has
 * started, the next one. If nobody looked for a while (the app was closed for weeks), it steps
 * forward to the first date still ahead; the editions in between happened, so they still count.
 * The new edition starts fresh (nobody going, no comments) and keeps everything else.
 */
export function nextEditions(events: EventItem[], now: Date): EventItem[] {
  const out: EventItem[] = [];
  for (const last of latestEditions(events)) {
    const s = last.series!;
    if (new Date(last.startsAt).getTime() > now.getTime()) continue;
    const length = last.endsAt ? new Date(last.endsAt).getTime() - new Date(last.startsAt).getTime() : null;
    let start = new Date(last.startsAt);
    let edition = s.edition;
    do {
      start = nextDate(start.toISOString(), s.repeat);
      edition++;
    } while (start.getTime() <= now.getTime());
    out.push({
      ...last,
      id: `${s.id}-n${edition}`,
      title: editionTitle(s.baseTitle, edition),
      startsAt: start.toISOString(),
      endsAt: length != null ? new Date(start.getTime() + length).toISOString() : undefined,
      goingUserIds: [],
      series: { ...s, edition },
    });
  }
  return out;
}

/** When the next edition will be due: the earliest start among latest editions still ahead (null = none). */
export function nextRollAt(events: EventItem[], now: Date): number | null {
  let best: number | null = null;
  for (const e of latestEditions(events)) {
    const t = new Date(e.startsAt).getTime();
    if (t > now.getTime() && (best == null || t < best)) best = t;
  }
  return best;
}
