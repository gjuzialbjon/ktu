import { NO_FILTERS, buildFeed, extraFilterCount, isFiltering, pickHighlights } from '@/features/feed/buildFeed';
import { NOW, at, makeEvent } from '@/test-utils/fixtures';

const tonight = makeEvent({ startsAt: at(0, 20), tags: ['jazz'] });
const tomorrow = makeEvent({ startsAt: at(1, 19), neighborhood: 'blloku', tags: ['jazz'] });
const saturday = makeEvent({ startsAt: at(3, 21), priceType: 'ticketed', ticketPriceLek: 700, category: 'music' });
const yesterday = makeEvent({ startsAt: at(-1, 20) });
const events = [saturday, tonight, yesterday, tomorrow];

describe('buildFeed', () => {
  it('splits today into the highlight row and the rest into sections', () => {
    const feed = buildFeed(events, NO_FILTERS, NOW);
    expect(feed.today.map((e) => e.id)).toEqual([tonight.id]);
    expect(feed.list.map((e) => e.id)).toEqual([tomorrow.id, saturday.id]);
    expect(feed.sections.map((s) => s.key)).toEqual(['tomorrow', 'weekend']);
    expect(feed.upcoming).not.toContain(yesterday);
  });

  it('applies filters to the list (today included, since the rows hide); the today row stays unfiltered', () => {
    const feed = buildFeed(events, { ...NO_FILTERS, hood: 'blloku' }, NOW);
    expect(feed.list.map((e) => e.id)).toEqual([tomorrow.id]);
    expect(feed.today).toHaveLength(1);
    expect(buildFeed(events, { ...NO_FILTERS, freeOnly: true }, NOW).list[0]).toBe(tonight);
  });

  it('treats a tag as a search, including today', () => {
    const feed = buildFeed(events, { ...NO_FILTERS, tag: 'jazz' }, NOW);
    expect(feed.list.map((e) => e.id)).toEqual([tonight.id, tomorrow.id]);
    expect(feed.sections.map((s) => s.key)).toEqual(['today', 'tomorrow']);
  });

  it('filters by spoken language, including today, counting it as one of the "more" filters', () => {
    const english = makeEvent({ startsAt: at(2, 19), languages: ['sq', 'en'] });
    const englishTonight = makeEvent({ startsAt: at(0, 21), languages: ['en'] });
    const feed = buildFeed([...events, english, englishTonight], { ...NO_FILTERS, lang: 'en' }, NOW);
    // a visitor wants tonight too, so (like a tag) it includes today
    expect(feed.list).toEqual([englishTonight, english]);
    expect(isFiltering({ ...NO_FILTERS, lang: 'it' })).toBe(true);
    expect(extraFilterCount({ ...NO_FILTERS, lang: 'it' })).toBe(1);
  });

  it('filters free-only and by category', () => {
    expect(buildFeed(events, { ...NO_FILTERS, freeOnly: true }, NOW).list).not.toContain(saturday);
    expect(buildFeed(events, { ...NO_FILTERS, cat: 'music' }, NOW).list).toEqual([saturday]);
  });

  it('marks at most two busy events as popular', () => {
    const busy = (n: number) => makeEvent({ startsAt: at(2, 20), goingUserIds: Array.from({ length: n }, (_, i) => `u${i}`) });
    const [a, b, c, quiet] = [busy(9), busy(7), busy(5), busy(3)];
    const { popularIds } = buildFeed([a, b, c, quiet], NO_FILTERS, NOW);
    expect([...popularIds].sort()).toEqual([a.id, b.id].sort());
  });

  it('counts this week across all events', () => {
    expect(buildFeed(events, NO_FILTERS, NOW).weekCount).toBe(3);
  });
});

describe('filter helpers', () => {
  it('knows when anything is filtered and counts the hidden ones', () => {
    expect(isFiltering(NO_FILTERS)).toBe(false);
    expect(isFiltering({ ...NO_FILTERS, tag: 'x' })).toBe(true);
    // categories have their own visible row, so only free + language count on the Filtra button
    expect(extraFilterCount({ ...NO_FILTERS, cat: 'food', freeOnly: true, lang: 'en' })).toBe(2);
  });
});

describe('pickHighlights', () => {
  it('leads with sponsored, then friends going, then turnout; capped', () => {
    const quiet = makeEvent({ startsAt: at(5, 19) });
    const busy = makeEvent({ startsAt: at(5, 19), goingUserIds: ['a', 'b', 'c', 'd'] });
    const friend = makeEvent({ startsAt: at(5, 19), goingUserIds: ['u2', 'x'] });
    const ad = makeEvent({ startsAt: at(5, 19), isSponsored: true });
    const order = pickHighlights([quiet, busy, friend, ad], ['u2'], NOW, 3).map((e) => e.id);
    expect(order).toEqual([ad.id, friend.id, busy.id]);
  });
});
