import type { EventOutcome } from './hostStanding';

/**
 * Demo only: what happened at the seed hosts' past events, so every host tier shows in the
 * prototype. A backend replaces this with outcomes recorded when real events end.
 *
 * - Trusted: the lake yoga (o1) and the book club (o4) fill up and people come back.
 * - Normal: most hosts, decent turnout.
 * - Limited: the photo walks (o28) keep ending empty.
 * - Low: the terrace DJ nights (o7) were cancelled at the last minute three times with people going.
 * - New: the stand-up night (o33) has no history yet.
 * Venues the team imported (source 'curated') with no history count as Normal.
 */
const H = 3600_000;
const DAY = 24 * H;

export function hostHistory(now: Date): EventOutcome[] {
  const ago = (days: number, hour = 19) => {
    const d = new Date(now.getTime() - days * DAY);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const before = (iso: string, hours: number) => new Date(new Date(iso).getTime() - hours * H).toISOString();
  const ran = (hostId: string, days: number, joined: number, extra: Partial<EventOutcome> = {}): EventOutcome => ({
    eventId: `${hostId}-past-${days}`,
    hostId,
    startsAt: ago(days),
    joined,
    ...extra,
  });
  const cancelled = (hostId: string, days: number, hoursBefore: number, affected: number): EventOutcome => {
    const startsAt = ago(days);
    return { eventId: `${hostId}-past-${days}`, hostId, startsAt, joined: 0, cancelledAt: before(startsAt, hoursBefore), affected };
  };

  return [
    // trusted: weekly lake yoga, regulars come back
    ...[7, 14, 21, 28, 35, 42, 49, 56].map((d, i) => ran('o1', d, 8 + (i % 4), { returning: 4 })),
    // trusted: monthly book club, 15 seats, nearly full
    ...[30, 60, 90, 120, 150].map((d, i) => ran('o4', d, 11 + (i % 3), { capacity: 15, returning: 5 })),
    // normal
    ...[10, 24, 38].map((d) => ran('o2', d, 5)),
    ...[12, 40, 75].map((d) => ran('o5', d, 9, { capacity: 25 })),
    ...[6, 13, 20, 27].map((d) => ran('o9', d, 10, { capacity: 20 })),
    ...[7, 14, 21].map((d) => ran('o26', d, 4)),
    ...[15, 45, 80].map((d) => ran('o30', d, 5, { capacity: 10 })),
    ...[9, 30, 51].map((d) => ran('o32', d, 6, { capacity: 16 })),
    // limited: six photo walks, four with nobody, two with one person
    ...[5, 12, 19, 26, 33, 40].map((d, i) => ran('o28', d, i % 3 === 1 ? 1 : 0, { views: 600 })),
    // low: three last-minute cancels with people going, one thin night
    cancelled('o7', 8, 3, 14),
    cancelled('o7', 22, 1, 20),
    ran('o7', 29, 2, { capacity: 120 }),
    cancelled('o7', 36, 6, 9),
  ];
}
