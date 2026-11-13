import { Lang } from './i18n';

export function formatWhen(iso: string, lang: Lang, todayWord: string, tomorrowWord: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString(lang === 'sq' ? 'sq-AL' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, now)) return `${todayWord} ${time}`;
  if (sameDay(d, tomorrow)) return `${tomorrowWord} ${time}`;
  const day = d.toLocaleDateString(lang === 'sq' ? 'sq-AL' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return `${day}, ${time}`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
