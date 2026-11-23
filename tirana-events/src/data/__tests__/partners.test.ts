import { PARTNERS, STAMP_GOAL, findOffer, findPartner, stampProgress } from '../partners';
import { CITIES } from '@ktu/shared';
import { SEED_EVENTS } from '../seed';

describe('partners', () => {
  it('has unique partner and offer ids, each offer pointing back at its partner', () => {
    const ids = PARTNERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const offerIds = PARTNERS.flatMap((p) => p.offers.map((o) => o.id));
    expect(new Set(offerIds).size).toBe(offerIds.length);
    for (const p of PARTNERS) for (const o of p.offers) expect(o.partnerId).toBe(p.id);
  });

  it('places every partner inside its city map', () => {
    for (const p of PARTNERS) {
      const b = CITIES[p.city].bounds;
      expect(p.lat).toBeGreaterThanOrEqual(b.latMin);
      expect(p.lat).toBeLessThanOrEqual(b.latMax);
      expect(p.lng).toBeGreaterThanOrEqual(b.lngMin);
      expect(p.lng).toBeLessThanOrEqual(b.lngMax);
    }
  });

  it('only attaches offers that exist, from a partner in the same city', () => {
    for (const e of SEED_EVENTS.filter((x) => x.offerId)) {
      const offer = findOffer(e.offerId);
      expect(offer).toBeDefined();
      expect(findPartner(offer!.partnerId)?.city).toBe(e.city);
    }
  });
});

describe('stampProgress', () => {
  it('counts distinct known partners and unlocks at the goal', () => {
    expect(stampProgress({})).toEqual({ count: 0, unlocked: false });
    expect(stampProgress({ p1: 'x', nope: 'x' })).toEqual({ count: 1, unlocked: false });
    const five = Object.fromEntries(PARTNERS.slice(0, STAMP_GOAL).map((p) => [p.id, 'x']));
    expect(stampProgress(five)).toEqual({ count: STAMP_GOAL, unlocked: true });
  });
});
