import type { AreaId, CityId } from './cities.ts';

/**
 * A picture the app can show: a URL or data-URL, or a bundled asset. Bundled assets are a number
 * on iOS/Android and { uri, width, height } on web. Kept free of React Native types so the
 * server can use this file too; the app passes it straight to <Image source>.
 */
export type ImageRef = number | { uri?: string; width?: number; height?: number };

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

/** A language an event is run in (or is comfortable for). Albanian is the default. */
export type SpokenLang = 'sq' | 'en' | 'it' | 'es';

/**
 * Who can find an event, and how you get in.
 * - public + open: in everyone's feed, details visible, join in one tap.
 * - public + ask:  in everyone's feed, but the host says yes first; exact place and time stay hidden until then.
 * - private + ask: only in feeds whose interests match (or where people you follow are going); details hidden.
 * - private + invite: never in the feed; reachable by link only.
 */
export type Visibility = 'public' | 'private';
export type JoinMode = 'open' | 'ask' | 'invite';


export interface Organizer {
  id: string;
  name: string;
  instagram?: string;
  verified: boolean;
  /** the photo or logo the host chose for their public host profile; cards show initials without one */
  avatarUrl?: string;
}

export interface ProgramStop {
  /** minutes after the start (0 = the start) */
  min: number;
  text: string;
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

/** Why a host cancelled; weather, illness and venue can be excused (see hostStanding). */
export type CancelReason = 'weather' | 'venue' | 'illness' | 'low_signups' | 'other';

/** How often a recurring event comes back. */
export type Repeat = 'weekly' | 'biweekly' | 'monthly';

/**
 * A recurring event: every edition is its own event (own id, own people going, own comments),
 * numbered in its title ("Yoga në Liqen #4"). The next edition appears once the latest starts.
 */
export interface Series {
  /** shared by every edition */
  id: string;
  repeat: Repeat;
  /** 1 for the first time it ran */
  edition: number;
  /** the title without " #N" */
  baseTitle: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  category: Category;
  /**
   * Languages the host is happy to run it in, so visitors know they can join.
   * Missing = Albanian only. Separate from category: an English-friendly jazz night is still music.
   */
  languages?: SpokenLang[];
  /** 1-6 lowercase free-form tags. They power future recommendations;
   *  v1 only displays and logs them. */
  tags: string[];
  /** Organizer-maintained FAQ shown as an accordion on the event page. */
  faq?: FaqItem[];
  /** "Good to know" bullets: bring a mat, cash only, dress code... */
  goodToKnow?: string[];
  /**
   * The evening step by step, like waypoints on a route: minutes from the start + what happens.
   * The first stop is where you meet; the last is how it ends. Shown as A → 1 → 2 → B.
   */
  program?: ProgramStop[];
  venueName: string;
  address: string;
  city: CityId;
  /** area id within `city` (see CITIES[city].areas) */
  neighborhood: AreaId;
  lat?: number;
  lng?: number;
  startsAt: string; // ISO
  endsAt?: string; // ISO
  /**
   * A URI/data-URL string from the picker, or a bundled asset from require(), which is a number on
   * iOS/Android but an object ({ uri, width, height }) on web. Missing or broken: EventPhoto shows the category.
   */
  coverImage?: string | ImageRef;
  /** Attribution shown on the event page; required by most Creative Commons licenses. */
  photoCredit?: string;
  priceType: PriceType;
  ticketPriceLek?: number;
  capacity?: number;
  /** platform = an event the app set up itself from what people are into, run by a facilitator */
  source: 'curated' | 'organizer' | 'platform';
  /** default public */
  visibility?: Visibility;
  /** default open */
  joinMode?: JoinMode;
  /** ask-to-join only: who lets people in; default 'host' (see AcceptMode) */
  acceptMode?: AcceptMode;
  /** PublicUser id of the person who takes care of the small things on the day */
  facilitatorId?: string;
  /** a partner offer every participant gets (see data/partners) */
  offerId?: string;
  /** seeded likes for the demo */
  likeCount?: number;
  /** set when the event repeats (see Series) */
  series?: Series;
  status: 'draft' | 'published' | 'cancelled';
  /** when the host cancelled (status 'cancelled'): a late cancel lowers their standing */
  cancelledAt?: string; // ISO
  cancelReason?: CancelReason;
  isSponsored: boolean;
  sponsoredLabel?: string;
  organizer: Organizer;
  /** Seeded social proof for the demo; replaced by real joins over time. */
  goingUserIds: string[];
}

/** requested = asked to join, waiting on the host */
export type RsvpStatus = 'going' | 'reserved' | 'cancelled' | 'requested';

export interface Rsvp {
  eventId: string;
  status: RsvpStatus;
  reservationCode?: string;
  createdAt: string; // ISO
}

/**
 * Ask-to-join: 'host' = the host answers every request; 'interests' = people who share at least one
 * of the event's tags get in at once, the rest wait for the host. The host picks per event.
 */
export type AcceptMode = 'host' | 'interests';

export interface PublicUser {
  id: string;
  name: string;
  avatarUrl?: string;
  /** what they are into; drives "people like you are going" */
  interests?: string[];
  /** has facilitated events; shown as a badge */
  facilitator?: boolean;
  /** who may see the events this person is going to; missing = 'nobody' */
  showGoing?: GoingVisibility;
  /** demo only: whether this person follows the viewer (the server works this out per viewer) */
  followsYou?: boolean;
}

/**
 * Who may see the events a person is going to (their name and face on the event). Each person
 * chooses in their profile; everyone starts at 'nobody'. Counts ("12 going") are always shown.
 * 'following' = the people this person follows.
 */
export type GoingVisibility = 'nobody' | 'following' | 'everyone';

export interface Profile {
  name: string;
  /** ids of PublicUser this user follows ("people you know") */
  follows: string[];
  /** default city: the feed, map and dice show this city's events */
  city: CityId;
  /** tags the user picked; private events only reach feeds whose interests overlap */
  interests: string[];
  /** tags the user never wants to see: events carrying one stay out of the feed (never in interests too) */
  hidden: string[];
  /** who may see the events this user is going to; starts at 'nobody' until they choose */
  showGoing: GoingVisibility;
}
