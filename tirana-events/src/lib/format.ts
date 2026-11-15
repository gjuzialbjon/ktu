import { Lang } from '@/lib/i18n';

export type TimeBucket = 'today' | 'tomorrow' | 'weekend' | 'later' | 'past';
export type WhenFilter = 'all' | 'today' | 'tomorrow' | 'weekend';

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function isWeekendSlot(d: Date): boolean {
  const day = d.getDay();
  return day === 6 || day === 0 || (day === 5 && d.getHours() >= 17);
}

/** Which home-feed section an event belongs to. Each event lands in exactly one. */
export function bucketOf(iso: string, now = new Date()): TimeBucket {
  const d = new Date(iso);
  if (d.getTime() < now.getTime() - 60 * 60_000) return 'past';
  if (sameDay(d, now)) return 'today';
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, tomorrow)) return 'tomorrow';
  const inAWeek = now.getTime() + 7 * 24 * 3600_000;
  if (d.getTime() <= inAWeek && isWeekendSlot(d)) return 'weekend';
  return 'later';
}

export function matchesWhen(iso: string, when: WhenFilter, now = new Date()): boolean {
  if (when === 'all') return bucketOf(iso, now) !== 'past';
  const b = bucketOf(iso, now);
  if (when === 'weekend') {
    const d = new Date(iso);
    return b !== 'past' && d.getTime() <= now.getTime() + 7 * 24 * 3600_000 && isWeekendSlot(d);
  }
  return b === when;
}

export function isThisWeek(iso: string, now = new Date()): boolean {
  const t = new Date(iso).getTime();
  return t >= now.getTime() - 60 * 60_000 && t <= now.getTime() + 7 * 24 * 3600_000;
}

export function formatWhen(iso: string, lang: Lang, todayWord: string, tomorrowWord: string): string {
  const d = new Date(iso);
  const now = new Date();
  const locale = lang === 'sq' ? 'sq-AL' : 'en-GB';
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, now)) return `${todayWord} ${time}`;
  if (sameDay(d, tomorrow)) return `${tomorrowWord} ${time}`;
  const day = d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' });
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${time}`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export const firstName = (name: string): string => name.trim().split(' ')[0] ?? name;

/** "Elisa", "Elisa dhe Gent", "Elisa, Gent +2" */
export function joinNames(names: string[], andWord: string): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} ${andWord} ${names[1]}`;
  return `${names[0]}, ${names[1]} +${names.length - 2}`;
}

/** Rough euro hint for visitors; Lek is ~100 per euro. */
export const lekToEur = (lek: number): number => Math.max(1, Math.round(lek / 100));
