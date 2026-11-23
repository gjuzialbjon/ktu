import {
  foreignLangsOf,
  langsAvailable,
  normalizeLangs,
  railsByLanguage,
  speaks,
  spokenLangs,
} from '@ktu/shared';
import { makeEvent } from '@ktu/shared/testing';

const albanian = makeEvent({});
const english = makeEvent({ languages: ['sq', 'en'] });
const englishOnly = makeEvent({ languages: ['en'] });
const italian = makeEvent({ languages: ['sq', 'it'] });

describe('languages', () => {
  it('treats a missing list as Albanian only', () => {
    expect(spokenLangs(albanian)).toEqual(['sq']);
    expect(speaks(albanian, 'sq')).toBe(true);
    expect(speaks(albanian, 'en')).toBe(false);
    expect(foreignLangsOf(albanian)).toEqual([]);
  });

  it('lists foreign languages in display order (English, Italian, Spanish)', () => {
    expect(foreignLangsOf(makeEvent({ languages: ['es', 'it', 'en'] }))).toEqual(['en', 'it', 'es']);
    expect(speaks(englishOnly, 'sq')).toBe(false);
  });

  it('only offers a filter for languages some event uses', () => {
    expect(langsAvailable([albanian, english, italian])).toEqual(['en', 'it']);
    expect(langsAvailable([albanian])).toEqual([]);
  });

  it('makes a row only when a language has enough events', () => {
    const rails = railsByLanguage([english, englishOnly, italian, albanian], 2);
    expect(rails.map((r) => r.lang)).toEqual(['en']);
    expect(rails[0]?.items).toEqual([english, englishOnly]);
  });

  it('normalises the form value: fixed order, Albanian-only stored as the default', () => {
    expect(normalizeLangs(['sq'])).toBeUndefined();
    expect(normalizeLangs([])).toBeUndefined();
    expect(normalizeLangs(['en', 'sq', 'en'])).toEqual(['sq', 'en']);
  });

});
