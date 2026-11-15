import { canSeeDetails, dayPartOf, forYou, isIn, sharedInterests, similarEvents, visibleInFeed } from '../access';
import type { Rsvp } from '../types';
import { NOW, at, makeEvent } from '@/test-utils/fixtures';

const rsvp = (status: Rsvp['status']): Rsvp => ({ eventId: 'x', status, createdAt: NOW.toISOString() });
const me = { interests: ['books', 'running'], follows: ['u2'] };

describe('canSeeDetails', () => {
  it('shows open events to everyone', () => {
    expect(canSeeDetails(makeEvent(), undefined)).toBe(true);
  });
  it('hides ask-to-join details until you are in', () => {
    const e = makeEvent({ joinMode: 'ask' });
    expect(canSeeDetails(e, undefined)).toBe(false);
    expect(canSeeDetails(e, rsvp('requested'))).toBe(false);
    expect(canSeeDetails(e, rsvp('going'))).toBe(true);
    expect(canSeeDetails(e, rsvp('reserved'))).toBe(true);
  });
});

describe('isIn', () => {
  it('counts going and reserved, not a pending request', () => {
    expect(isIn(rsvp('going'))).toBe(true);
    expect(isIn(rsvp('requested'))).toBe(false);
    expect(isIn(undefined)).toBe(false);
  });
});

describe('visibleInFeed', () => {
  it('always shows public events', () => {
    expect(visibleInFeed(makeEvent({ joinMode: 'ask' }), me, undefined)).toBe(true);
  });
  it('shows private events only on shared interests or a followed person going', () => {
    expect(visibleInFeed(makeEvent({ visibility: 'private', joinMode: 'ask', tags: ['books'] }), me, undefined)).toBe(true);
    expect(visibleInFeed(makeEvent({ visibility: 'private', joinMode: 'ask', tags: ['golf'] }), me, undefined)).toBe(false);
    expect(
      visibleInFeed(makeEvent({ visibility: 'private', joinMode: 'ask', tags: ['golf'], goingUserIds: ['u2'] }), me, undefined),
    ).toBe(true);
  });
  it('never shows invite-only events unless you are on them', () => {
    const e = makeEvent({ visibility: 'private', joinMode: 'invite', tags: ['books'] });
    expect(visibleInFeed(e, me, undefined)).toBe(false);
    expect(visibleInFeed(e, me, rsvp('going'))).toBe(true);
  });
});

describe('sharedInterests', () => {
  it('keeps the event tag order', () => {
    expect(sharedInterests(makeEvent({ tags: ['running', 'x', 'books'] }), me.interests)).toEqual(['running', 'books']);
  });
});

describe('dayPartOf', () => {
  it.each([
    [7, 'morning'],
    [13, 'afternoon'],
    [19, 'evening'],
    [23, 'night'],
    [2, 'night'],
  ])('%i:00 is %s', (h, part) => {
    expect(dayPartOf(at(1, h))).toBe(part);
  });
});

describe('similarEvents', () => {
  it('ranks by shared tags, same city, upcoming only', () => {
    const base = makeEvent({ tags: ['a', 'b', 'c'] });
    const two = makeEvent({ tags: ['a', 'b'], startsAt: at(3, 19) });
    const one = makeEvent({ tags: ['a'], startsAt: at(1, 19) });
    const other = makeEvent({ tags: ['a', 'b', 'c'], city: 'durres' });
    const past = makeEvent({ tags: ['a', 'b', 'c'], startsAt: at(-1, 19) });
    const none = makeEvent({ tags: ['z'] });
    expect(similarEvents(base, [base, one, two, other, past, none], NOW.getTime()).map((e) => e.id)).toEqual([two.id, one.id]);
  });
});

describe('forYou', () => {
  it('returns nothing rather than guessing when there is nothing to go on', () => {
    expect(forYou([makeEvent()], [], [])).toEqual([]);
  });
  it('uses interests and joined tags, best match first', () => {
    const a = makeEvent({ tags: ['books'] });
    const b = makeEvent({ tags: ['books', 'jazz'] });
    const c = makeEvent({ tags: ['golf'] });
    expect(forYou([a, b, c], ['books'], ['jazz']).map((e) => e.id)).toEqual([b.id, a.id]);
  });
});
