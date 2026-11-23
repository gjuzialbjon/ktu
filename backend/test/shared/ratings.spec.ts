import {
  MIN_RATINGS_COUNTED,
  canRate,
  gradeOutcome,
  hostStanding,
  makeRating,
  needsReview,
  outcomeOf,
  ratingGrade,
  summarizeRatings,
  type Rating,
  type Rsvp,
} from '@ktu/shared';
import { NOW, at, makeEvent } from '@ktu/shared/testing';

const going: Rsvp = { eventId: 'e', status: 'going', createdAt: at(-3, 10) };
const H = 3600_000;
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * H).toISOString();
type R = Pick<Rating, 'stars' | 'issues'>;
const stars = (...s: number[]): R[] => s.map((n) => ({ stars: n as Rating['stars'], issues: [] }));

describe('canRate', () => {
  const ended = makeEvent({ startsAt: hoursAgo(5), endsAt: hoursAgo(3) });

  it('lets people who went rate once the event has ended', () => {
    expect(canRate(ended, going, NOW)).toBe(true);
  });
  it('not before the end, and not without being in', () => {
    expect(canRate(makeEvent({ startsAt: hoursAgo(1) }), going, NOW)).toBe(false);
    expect(canRate(ended, undefined, NOW)).toBe(false);
    expect(canRate(ended, { ...going, status: 'requested' }, NOW)).toBe(false);
  });
  it('only for a week', () => {
    expect(canRate(makeEvent({ startsAt: hoursAgo(8 * 24) }), going, NOW)).toBe(false);
  });
  it('never your own event, never a cancelled one', () => {
    expect(canRate(makeEvent({ startsAt: hoursAgo(5), organizer: { id: 'me', name: 'Ti', verified: false } }), going, NOW)).toBe(false);
    expect(canRate(makeEvent({ startsAt: hoursAgo(5), status: 'cancelled' }), going, NOW)).toBe(false);
  });
});

describe('makeRating', () => {
  it('refuses stars outside 1–5', () => {
    expect(makeRating('e', 0, [], '', 'now')).toBeNull();
    expect(makeRating('e', 6, [], '', 'now')).toBeNull();
    expect(makeRating('e', 2.5, [], '', 'now')).toBeNull();
  });
  it('keeps known issues once, and trims the note', () => {
    const r = makeRating('e', 2, ['felt_unsafe', 'felt_unsafe', 'nonsense'], '  late  ', 'now');
    expect(r).toMatchObject({ stars: 2, issues: ['felt_unsafe'], note: 'late' });
    expect(makeRating('e', 5, [], '   ', 'now')?.note).toBeUndefined();
  });
});

describe('ratingGrade', () => {
  it('does nothing until enough people rated', () => {
    expect(ratingGrade(MIN_RATINGS_COUNTED - 1, 1)).toBe(0);
  });
  it('lifts great events a little and sinks poor ones more', () => {
    expect(ratingGrade(5, 4.8)).toBe(1);
    expect(ratingGrade(5, 4)).toBe(0);
    expect(ratingGrade(5, 3)).toBe(-1);
    expect(ratingGrade(5, 1.5)).toBe(-2);
  });
});

describe('needsReview', () => {
  it('always when someone felt unsafe', () => {
    expect(needsReview(summarizeRatings([{ stars: 5, issues: ['felt_unsafe'] }]))).toBe(true);
  });
  it('a single complaint among many waits; two people or a third of raters go to the team', () => {
    const one: R[] = [{ stars: 2, issues: ['not_as_described'] }, ...stars(5, 5, 4, 5)];
    expect(needsReview(summarizeRatings(one))).toBe(false);
    expect(needsReview(summarizeRatings([...one, { stars: 1, issues: ['not_as_described'] }]))).toBe(true);
    expect(needsReview(summarizeRatings([{ stars: 1, issues: ['didnt_happen'] }, ...stars(3, 4)]))).toBe(true);
  });
});

describe('ratings in host standing', () => {
  it('poorly rated events grade lower than the same turnout rated well', () => {
    const base = { eventId: 'x', hostId: 'h', startsAt: hoursAgo(48), joined: 8 };
    expect(gradeOutcome({ ...base, ratings: 6, ratingAvg: 1.8 })).toBeLessThan(gradeOutcome(base));
    expect(gradeOutcome({ ...base, ratings: 6, ratingAvg: 4.9 })).toBeGreaterThan(gradeOutcome(base));
  });
  it('outcomeOf carries an ended event\'s ratings, and the host average adds them up', () => {
    const e = makeEvent({ startsAt: hoursAgo(5), organizer: { id: 'h', name: 'H', verified: false } });
    const o = outcomeOf(e, NOW, stars(5, 4, 3));
    expect(o).toMatchObject({ ratings: 3, ratingAvg: 4 });
    const s = hostStanding('h', [o!, { eventId: 'y', hostId: 'h', startsAt: hoursAgo(100), joined: 3, ratings: 1, ratingAvg: 2 }], NOW);
    expect(s.ratings).toBe(4);
    expect(s.ratingAvg).toBe(3.5);
  });
});
