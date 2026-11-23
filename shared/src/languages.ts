import type { EventItem, SpokenLang } from './types.ts';

/**
 * Which languages an event works in. Pure helpers shared by the feed, the filter bar,
 * the cards and the create form.
 *
 * Albanian is assumed unless a host says otherwise. The "foreign" ones (English, Italian,
 * Spanish) are what visitors filter by. A language only shows up as a filter or a row once
 * at least one event uses it, so adding one here never creates an empty filter.
 */

/** Order they appear in filters and rows: most visitors first. */
export const FOREIGN_LANGS: Exclude<SpokenLang, 'sq'>[] = ['en', 'it', 'es'];
export const ALL_LANGS: SpokenLang[] = ['sq', ...FOREIGN_LANGS];

/** Short code shown on badges. */
export const LANG_CODE: Record<SpokenLang, string> = { sq: 'SQ', en: 'EN', it: 'IT', es: 'ES' };

/**
 * Row titles are written in the language itself, whatever the app language: a visitor
 * spots their own language faster than a translation of it.
 */
export const LANG_ROW_TITLE: Record<Exclude<SpokenLang, 'sq'>, string> = {
  en: 'English-friendly',
  it: 'Si parla italiano',
  es: 'Se habla español',
};

/** A row needs a few events to be worth a carousel; fewer are still findable by filter. */
export const LANG_ROW_MIN = 3;

export const spokenLangs = (e: EventItem): SpokenLang[] =>
  e.languages && e.languages.length > 0 ? e.languages : ['sq'];

export const speaks = (e: EventItem, lang: SpokenLang): boolean => spokenLangs(e).includes(lang);

/** The non-Albanian languages an event works in, in display order. */
export const foreignLangsOf = (e: EventItem): Exclude<SpokenLang, 'sq'>[] =>
  FOREIGN_LANGS.filter((l) => speaks(e, l));

/** Foreign languages that at least one of these events uses (for the filter chips). */
export const langsAvailable = (events: EventItem[]): Exclude<SpokenLang, 'sq'>[] =>
  FOREIGN_LANGS.filter((l) => events.some((e) => speaks(e, l)));

/** One row per foreign language with enough events. */
export function railsByLanguage(events: EventItem[], min = LANG_ROW_MIN) {
  return FOREIGN_LANGS.map((lang) => ({ lang, items: events.filter((e) => speaks(e, lang)) })).filter(
    (r) => r.items.length >= min,
  );
}

/** Form value → stored value: fixed order, no duplicates; Albanian only (the default) is stored as nothing. */
export function normalizeLangs(picked: SpokenLang[]): SpokenLang[] | undefined {
  const set = ALL_LANGS.filter((l) => picked.includes(l));
  if (set.length === 0 || (set.length === 1 && set[0] === 'sq')) return undefined; // the default
  return set;
}
