import { NO_FILTERS, buildFeed, extraFilterCount, isFiltering } from '@/features/feed/buildFeed';
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

  it('applies filters below the bar only; the today row stays unfiltered', () => {
    const feed = buildFeed(events, { ...NO_FILTERS, hood: 'blloku' }, NOW);
    expect(feed.list.map((e) => e.id)).toEqual([tomorrow.id]);
    expect(feed.today).toHaveLength(1);
  });

  it('treats a tag as a search, including today', () => {
    const feed = buildFeed(events, { ...NO_FILTERS, tag: 'jazz' }, NOW);
    expect(feed.list.map((e) => e.id)).toEqual([tonight.id, tomorrow.id]);
    expect(feed.sections.map((s) => s.key)).toEqual(['today', 'tomorrow']);
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
    expect(extraFilterCount({ ...NO_FILTERS, cat: 'food', freeOnly: true })).toBe(2);
  });
});
