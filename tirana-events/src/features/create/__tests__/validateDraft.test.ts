import { DraftForm, parseTags, validateDraft } from '@/features/create/validateDraft';
import { NOW } from '@/test-utils/fixtures';

const valid: DraftForm = {
  title: 'Chess at the lake',
  description: '  bring a board  ',
  venue: 'Parku i Madh',
  city: 'tirana',
  hood: 'liqeni',
  when: new Date(2026, 10, 20, 18, 0),
  tags: 'Chess, Board Games',
  price: '',
  photo: null,
  langs: ['sq'],
  repeat: null,
};

describe('validateDraft', () => {
  it('accepts a complete form and normalises it', () => {
    const r = validateDraft(valid, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toMatchObject({ city: 'tirana', neighborhood: 'liqeni', description: 'bring a board', tags: ['chess', 'board-games'], ticketPriceLek: undefined });
    }
  });

  it('stores Albanian-only as the default and keeps picked languages in a fixed order', () => {
    const plain = validateDraft(valid, NOW);
    const mixed = validateDraft({ ...valid, langs: ['it', 'sq', 'en'] }, NOW);
    expect(plain.ok && plain.value.languages).toBeUndefined();
    expect(mixed.ok && mixed.value.languages).toEqual(['sq', 'en', 'it']);
  });

  it('flags every missing required field at once', () => {
    const r = validateDraft({ ...valid, title: '', venue: ' ', hood: null, when: null, tags: '' }, NOW);
    expect(r).toEqual({
      ok: false,
      errors: { title: 'err_required', venue: 'err_required', hood: 'err_required', date: 'err_required', tags: 'err_tags' },
    });
  });

  it.each([
    ['short title', { title: 'Yoga' }, { title: 'err_title_short' }],
    ['past date', { when: new Date(2026, 10, 17) }, { date: 'err_date_past' }],
    ['too many tags', { tags: 'a,b,c,d,e,f,g' }, { tags: 'err_tags' }],
    ['decimal price', { price: '7.5' }, { price: 'err_price' }],
    ['negative price', { price: '-100' }, { price: 'err_price' }],
    ['text price', { price: 'cheap' }, { price: 'err_price' }],
  ])('rejects %s', (_name, change, errors) => {
    expect(validateDraft({ ...valid, ...change }, NOW)).toEqual({ ok: false, errors });
  });

  it('rejects an area that does not belong to the picked city', () => {
    // 'lungomare' is in Vlora, not Tirana: e.g. the city was switched after picking the area
    expect(validateDraft({ ...valid, hood: 'lungomare' }, NOW)).toEqual({ ok: false, errors: { hood: 'err_required' } });
    expect(validateDraft({ ...valid, city: 'vlore', hood: 'lungomare' }, NOW).ok).toBe(true);
  });

  it('turns a whole-number price into a ticketed draft', () => {
    const r = validateDraft({ ...valid, price: ' 700 ' }, NOW);
    expect(r.ok && r.value.ticketPriceLek).toBe(700);
  });
});

describe('parseTags', () => {
  it('lowercases, hyphenates and drops blanks', () => {
    expect(parseTags(' Live Music,,  JAZZ ,')).toEqual(['live-music', 'jazz']);
  });
});
