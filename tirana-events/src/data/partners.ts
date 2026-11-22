import type { Lang } from '@/lib/i18n';
import type { CityId } from './cities';

/**
 * Partners are places (bookshops, restaurants, cafés, shops) that give something to
 * the people who show up to events. Each partner has a set of offers; an event can
 * carry one offer (chosen by the facilitator, the creator, or the system from the
 * event's profile), and every participant gets it.
 *
 * Demo data: these businesses are made up. Real partners replace this list.
 */
export type PartnerKind = 'books' | 'food' | 'coffee' | 'sport' | 'bar' | 'craft';

export interface Offer {
  id: string;
  partnerId: string;
  percent: number;
  text: Record<Lang, string>;
}

export interface Partner {
  id: string;
  city: CityId;
  kind: PartnerKind;
  name: string;
  lat: number;
  lng: number;
  blurb: Record<Lang, string>;
  offers: Offer[];
}

export const PARTNER_EMOJI: Record<PartnerKind, string> = {
  books: '📚',
  food: '🍲',
  coffee: '☕',
  sport: '👟',
  bar: '🍹',
  craft: '🧶',
};

const offer = (partnerId: string, n: number, percent: number, sq: string, en: string): Offer => ({
  id: `${partnerId}-o${n}`,
  partnerId,
  percent,
  text: { sq, en },
});

export const PARTNERS: Partner[] = [
  {
    id: 'p1',
    city: 'tirana',
    kind: 'books',
    name: 'Libraria Kapaku',
    lat: 41.3262,
    lng: 19.8189,
    blurb: { sq: 'Libra të rinj e të vjetër, kafe në qoshe.', en: 'New and used books, coffee in the corner.' },
    offers: [
      offer('p1', 1, 10, '10% zbritje për librin e klubit', '10% off the book club pick'),
      offer('p1', 2, 15, '15% për çdo libër, ditën e eventit', '15% off any book on the day'),
    ],
  },
  {
    id: 'p2',
    city: 'tirana',
    kind: 'food',
    name: 'Te Sofra e Madhe',
    lat: 41.3215,
    lng: 19.8128,
    blurb: { sq: 'Tavolinë e gjatë, gatim shtëpie.', en: 'One long table, home cooking.' },
    offers: [offer('p2', 1, 5, '5% në darkë, për gjithë tavolinën', '5% off dinner for the whole table')],
  },
  {
    id: 'p3',
    city: 'tirana',
    kind: 'coffee',
    name: 'Kafja e Mengjesit',
    lat: 41.3288,
    lng: 19.8235,
    blurb: { sq: 'Kafe e pjekur këtu, hapur nga ora 7.', en: 'Roasted in-house, open from 7.' },
    offers: [offer('p3', 1, 15, 'Kafja e dytë me 15% pas eventit', '15% off your second coffee after')],
  },
  {
    id: 'p4',
    city: 'tirana',
    kind: 'sport',
    name: 'Hapi Running',
    lat: 41.3172,
    lng: 19.8205,
    blurb: { sq: 'Këpucë vrapimi, provë falas në park.', en: 'Running shoes, free try-outs in the park.' },
    offers: [offer('p4', 1, 10, '10% për veshje vrapimi', '10% off running gear')],
  },
  {
    id: 'p5',
    city: 'tirana',
    kind: 'bar',
    name: 'Bar Muzgu',
    lat: 41.3205,
    lng: 19.8172,
    blurb: { sq: 'Tarracë me pamje, edhe pije pa alkool.', en: 'Terrace with a view, alcohol-free drinks too.' },
    offers: [offer('p5', 1, 10, '10% në pije pas eventit', '10% off drinks after the event')],
  },
  {
    id: 'p6',
    city: 'tirana',
    kind: 'craft',
    name: 'Punishtja e Baltes',
    lat: 41.3312,
    lng: 19.8102,
    blurb: { sq: 'Qeramikë me dorë, kurse të vogla.', en: 'Hand-made ceramics, small classes.' },
    offers: [offer('p6', 1, 20, '20% në kursin e parë', '20% off your first class')],
  },
  {
    id: 'p7',
    city: 'durres',
    kind: 'food',
    name: 'Peshku i Dites',
    lat: 41.3122,
    lng: 19.4465,
    blurb: { sq: 'Peshk i freskët në mol.', en: 'Fresh fish on the pier.' },
    offers: [offer('p7', 1, 10, '10% në darkë për pjesëmarrësit', '10% off dinner for participants')],
  },
  {
    id: 'p8',
    city: 'vlore',
    kind: 'coffee',
    name: 'Kafe Lungo',
    lat: 40.4575,
    lng: 19.4855,
    blurb: { sq: 'Kafe buzë detit.', en: 'Coffee by the sea.' },
    offers: [offer('p8', 1, 10, '10% pas vozitjes me kajak', '10% off after the kayak trip')],
  },
];

/** Collect a stamp at this many different partners to unlock the reward. */
export const STAMP_GOAL = 5;
export const STAMP_REWARD_PERCENT = 20;

const OFFERS = new Map(PARTNERS.flatMap((p) => p.offers.map((o) => [o.id, o] as const)));
const BY_ID = new Map(PARTNERS.map((p) => [p.id, p] as const));

export const findOffer = (id: string | undefined): Offer | undefined => (id ? OFFERS.get(id) : undefined);
export const findPartner = (id: string): Partner | undefined => BY_ID.get(id);
export const partnersIn = (city: CityId): Partner[] => PARTNERS.filter((p) => p.city === city);

/** Distinct partners stamped (one per partner, however many visits) and whether the reward is unlocked. */
export function stampProgress(stamps: Record<string, string>): { count: number; unlocked: boolean } {
  const count = Object.keys(stamps).filter((id) => BY_ID.has(id)).length;
  return { count: Math.min(count, STAMP_GOAL), unlocked: count >= STAMP_GOAL };
}
