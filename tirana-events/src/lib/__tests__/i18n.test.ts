import { DICTS } from '@/lib/i18n';

describe('dictionaries', () => {
  const sq = DICTS.sq as Record<string, unknown>;
  const en = DICTS.en as Record<string, unknown>;

  it('have the same keys in both languages', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(sq).sort());
  });

  it('agree on which entries are functions and how many arguments they take', () => {
    for (const key of Object.keys(sq)) {
      const a = sq[key];
      const b = en[key];
      expect([key, typeof b]).toEqual([key, typeof a]);
      if (typeof a === 'function' && typeof b === 'function') expect([key, b.length]).toEqual([key, a.length]);
    }
  });

  it('have no empty strings', () => {
    for (const [lang, dict] of Object.entries({ sq, en })) {
      for (const [key, v] of Object.entries(dict)) {
        if (typeof v === 'string') expect([lang, key, v.trim().length > 0]).toEqual([lang, key, true]);
      }
    }
  });
});
