import type { EventItem } from './types';
import type { Lang } from '@/lib/i18n';
import { speaks } from './languages';
import { bucketOf, matchesWhen } from '@/lib/format';

/**
 * Curated lists, like a route app's collections: a cover, a title with a point of view and a
 * rule that picks events. The rule keeps them filled as events come and go; a list only shows
 * once it has COLLECTION_MIN events, so nobody opens an empty one.
 */
export interface Collection {
  id: string;
  emoji: string;
  title: Record<Lang, string>;
  blurb: Record<Lang, string>;
  match: (e: EventItem, now: Date) => boolean;
}

export const COLLECTION_MIN = 3;

const hasTag = (e: EventItem, ...tags: string[]) => e.tags.some((t) => tags.includes(t));

export const COLLECTIONS: Collection[] = [
  {
    id: 'sapo-erdhe',
    emoji: '🧳',
    title: { sq: 'Sapo erdhe ne Tirane', en: 'New in Tirana' },
    blurb: {
      sq: 'Vende ku flitet edhe anglisht dhe ku njerezit jane mesuar me fytyra te reja.',
      en: 'Places where English works and people are used to new faces.',
    },
    match: (e) => hasTag(e, 'newcomers') || (speaks(e, 'en') && hasTag(e, 'meet-people', 'beginner-friendly', 'social')),
  },
  {
    id: 'vjen-vete',
    emoji: '🙋',
    title: { sq: "Vjen vetem? S'ka gje", en: "Coming alone? That's fine" },
    blurb: {
      sq: 'Grupe te vogla dhe nje host qe te prezanton. Askush s\'rri menjane.',
      en: 'Small groups and a host who introduces you. Nobody stands in a corner.',
    },
    match: (e) => e.source === 'platform' || hasTag(e, 'meet-people', 'small-group'),
  },
  {
    id: 'jashte',
    emoji: '🌿',
    title: { sq: 'Jashte, ne ajer te paster', en: 'Out in the fresh air' },
    blurb: {
      sq: 'Liqeni, Dajti, rruget e qytetit. Gjera qe behen me kembe.',
      en: 'The lake, Dajti, the city streets. Things you do on foot.',
    },
    match: (e) => e.category === 'outdoors' || hasTag(e, 'outdoor', 'hiking', 'running', 'walk'),
  },
  {
    id: 'pa-para',
    emoji: '🪙',
    title: { sq: 'Fundjave pa para', en: 'A weekend for free' },
    blurb: {
      sq: 'Te shtunen dhe te dielen, pa hyrje. Paguan vetem ate qe porosit.',
      en: 'Saturday and Sunday, no entry fee. You only pay for what you order.',
    },
    match: (e, now) => e.priceType === 'free' && matchesWhen(e.startsAt, 'weekend', now),
  },
  {
    id: 'nate',
    emoji: '🌙',
    title: { sq: 'Nata e gjate', en: 'The long night' },
    blurb: {
      sq: 'Per kur s\'do te kthehesh heret ne shpi.',
      en: "For when you're not going home early.",
    },
    match: (e) => e.category === 'nightlife' || new Date(e.startsAt).getHours() >= 21,
  },
];

export const findCollection = (id: string | undefined) => COLLECTIONS.find((c) => c.id === id);

/** Events still to come in a collection, soonest first. */
export function collectionEvents(c: Collection, events: EventItem[], now: Date): EventItem[] {
  return events
    .filter((e) => bucketOf(e.startsAt, now) !== 'past' && c.match(e, now))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/**
 * The collections worth showing right now (enough events), each with its events and a cover.
 * Covers are picked in order so no two collections share a photo when it can be avoided:
 * the first event with a real photo not used yet, else any with a photo, else the first event.
 */
export function liveCollections(events: EventItem[], now: Date, min = COLLECTION_MIN) {
  const used = new Set<string>();
  return COLLECTIONS.map((c) => ({ collection: c, items: collectionEvents(c, events, now) }))
    .filter((x) => x.items.length >= Math.max(1, min))
    .map((x) => {
      const withPhoto = x.items.filter((e) => typeof e.coverImage !== 'undefined');
      const cover = withPhoto.find((e) => !used.has(e.id)) ?? withPhoto[0] ?? x.items[0];
      used.add(cover.id);
      return { ...x, cover };
    });
}
