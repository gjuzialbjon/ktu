import {
  MAX_PINNED_SPONSORED,
  eventsForCity,
  makeComment,
  makeDraftEvent,
  makeRsvp,
  orderFeedEvents,
  reservationCode,
  spotsLeft,
} from '@/data/events';
import { at, makeEvent } from '@/test-utils/fixtures';

describe('orderFeedEvents', () => {
  it('hides drafts and cancelled events', () => {
    const shown = orderFeedEvents([makeEvent(), makeEvent({ status: 'draft' }), makeEvent({ status: 'cancelled' })]);
    expect(shown).toHaveLength(1);
  });

  it(`pins at most ${MAX_PINNED_SPONSORED} sponsored events on top, then sorts by time`, () => {
    const late = makeEvent({ startsAt: at(5, 20) });
    const early = makeEvent({ startsAt: at(1, 9) });
    const s1 = makeEvent({ isSponsored: true, startsAt: at(6, 20) });
    const s2 = makeEvent({ isSponsored: true, startsAt: at(7, 20) });
    const s3 = makeEvent({ isSponsored: true, startsAt: at(2, 20) });
    const ids = orderFeedEvents([late, s1, early, s2, s3]).map((e) => e.id);
    expect(ids.slice(0, 2)).toEqual([s1.id, s2.id]);
    // the third sponsored event falls back into time order
    expect(ids.slice(2)).toEqual([early.id, s3.id, late.id]);
  });
});

describe('eventsForCity', () => {
  it('shows one city only, with its own sponsored slots', () => {
    const tiranaAds = [1, 2].map(() => makeEvent({ isSponsored: true }));
    const durresAd = makeEvent({ city: 'durres', neighborhood: 'plazhi', isSponsored: true });
    const durresEvent = makeEvent({ city: 'durres', neighborhood: 'qendra' });
    const all = [...tiranaAds, durresAd, durresEvent];
    expect(eventsForCity(all, 'durres').map((e) => e.id)).toEqual([durresAd.id, durresEvent.id]);
    expect(eventsForCity(all, 'tirana')).toHaveLength(2);
    expect(eventsForCity(all, 'berat')).toEqual([]);
  });
});

describe('makeRsvp', () => {
  it('is a plain "going" for free events', () => {
    const r = makeRsvp(makeEvent(), '2026-11-18T12:00:00.000Z');
    expect(r).toMatchObject({ status: 'going', reservationCode: undefined });
  });

  it('reserves ticketed events with a code', () => {
    const r = makeRsvp(makeEvent({ priceType: 'ticketed', ticketPriceLek: 700 }), 'now', () => 'TE-ABCD');
    expect(r).toMatchObject({ status: 'reserved', reservationCode: 'TE-ABCD' });
  });
});

describe('reservationCode', () => {
  it('is TE- plus four uppercase characters', () => {
    expect(reservationCode()).toMatch(/^TE-[0-9A-Z]{4}$/);
    expect(reservationCode(() => 0.5)).toMatch(/^TE-[0-9A-Z]{4}$/); // short base-36 output is padded
  });
});

describe('makeDraftEvent', () => {
  it('creates an unpublished draft, ticketed only when priced', () => {
    const input = {
      title: 'Chess night',
      description: '',
      venueName: 'Bar',
      tags: ['chess'],
      startsAt: at(2, 19),
      city: 'tirana' as const,
      neighborhood: 'blloku',
    };
    expect(makeDraftEvent(input, 'd1')).toMatchObject({ status: 'draft', priceType: 'free' });
    expect(makeDraftEvent({ ...input, ticketPriceLek: 500 }, 'd2')).toMatchObject({ priceType: 'ticketed' });
  });
});

describe('makeComment', () => {
  it('trims text and refuses empty comments', () => {
    expect(makeComment('e1', '   ', 'Ti', 'c1', 'now')).toBeNull();
    expect(makeComment('e1', '  hi  ', 'Ti', 'c1', 'now')?.text).toBe('hi');
  });
});

describe('spotsLeft', () => {
  it('counts you once you join and never goes negative', () => {
    const e = makeEvent({ capacity: 3, goingUserIds: ['a', 'b'] });
    expect(spotsLeft(e, false)).toBe(1);
    expect(spotsLeft(e, true)).toBe(0);
    expect(spotsLeft(makeEvent({ capacity: 1, goingUserIds: ['a', 'b'] }), true)).toBe(0);
    expect(spotsLeft(makeEvent(), false)).toBeNull();
  });
});
