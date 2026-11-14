export type Category =
  | 'community'
  | 'music'
  | 'nightlife'
  | 'culture'
  | 'sports'
  | 'business'
  | 'food'
  | 'outdoors';

export type PriceType = 'free' | 'ticketed';

export type Neighborhood = 'qendra' | 'blloku' | 'liqeni' | 'pazari' | 'periferia';

export const NEIGHBORHOODS: Neighborhood[] = ['qendra', 'blloku', 'liqeni', 'pazari', 'periferia'];

export interface Organizer {
  id: string;
  name: string;
  instagram?: string;
  verified: boolean;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Comment {
  id: string;
  eventId: string;
  author: string;
  text: string;
  isOrganizer: boolean;
  createdAt: string; // ISO
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: Category;
  /** 1-6 lowercase free-form tags. They power future recommendations;
   *  v1 only displays and logs them. */
  tags: string[];
  /** Organizer-maintained FAQ shown as an accordion on the event page. */
  faq?: FaqItem[];
  /** "Good to know" bullets: bring a mat, cash only, dress code... */
  goodToKnow?: string[];
  venueName: string;
  address: string;
  neighborhood: Neighborhood;
  lat?: number;
  lng?: number;
  startsAt: string; // ISO
  endsAt?: string; // ISO
  coverImage: string;
  priceType: PriceType;
  ticketPriceLek?: number;
  capacity?: number;
  source: 'curated' | 'organizer';
  status: 'draft' | 'published' | 'cancelled';
  isSponsored: boolean;
  sponsoredLabel?: string;
  organizer: Organizer;
  /** Seeded social proof for the demo; replaced by real joins over time. */
  goingUserIds: string[];
}

export type RsvpStatus = 'going' | 'reserved' | 'cancelled';

export interface Rsvp {
  eventId: string;
  status: RsvpStatus;
  reservationCode?: string;
  createdAt: string; // ISO
}

export interface PublicUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Profile {
  name: string;
  /** ids of PublicUser this user follows ("people you know") */
  follows: string[];
}
