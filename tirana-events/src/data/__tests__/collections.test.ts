import { COLLECTIONS, collectionEvents, findCollection, liveCollections } from '@/data/collections';
import { SEED_EVENTS } from '@/data/seed';
import { NOW, at, makeEvent } from '@ktu/shared/testing';

describe('collections', () => {
  it('has unique ids and both languages for every title and blurb', () => {
    expect(new Set(COLLECTIONS.map((c) => c.id)).size).toBe(COLLECTIONS.length);
    for (const c of COLLECTIONS) {
      expect(c.title.sq && c.title.en && c.blurb.sq && c.blurb.en).toBeTruthy();
    }
  });

  it('lists only upcoming matches, soonest first', () => {
    const outdoors = findCollection('jashte')!;
    const later = makeEvent({ category: 'outdoors', startsAt: at(3, 9) });
    const sooner = makeEvent({ category: 'outdoors', startsAt: at(1, 9) });
    const past = makeEvent({ category: 'outdoors', startsAt: at(-1, 9) });
    const music = makeEvent({ category: 'music', startsAt: at(1, 20) });
    expect(collectionEvents(outdoors, [later, past, music, sooner], NOW)).toEqual([sooner, later]);
  });

  it('only shows a collection once it has enough events', () => {
    const two = [makeEvent({ category: 'outdoors', startsAt: at(1, 9) }), makeEvent({ category: 'outdoors', startsAt: at(2, 9) })];
    expect(liveCollections(two, NOW, 3).some((x) => x.collection.id === 'jashte')).toBe(false);
    expect(liveCollections(two, NOW, 2).some((x) => x.collection.id === 'jashte')).toBe(true);
  });

  it('gives each collection its own cover when it can', () => {
    const tirana = SEED_EVENTS.filter((e) => e.city === 'tirana');
    const live = liveCollections(tirana, new Date(), 3);
    const covers = live.map((x) => x.cover.id);
    expect(new Set(covers).size).toBe(covers.length);
    for (const x of live) expect(x.items).toContain(x.cover);
  });

  it('fills several collections from the seed', () => {
    const tirana = SEED_EVENTS.filter((e) => e.city === 'tirana');
    expect(liveCollections(tirana, new Date(), 3).length).toBeGreaterThanOrEqual(3);
  });
});
