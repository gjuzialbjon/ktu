import { AreaId, type Audience, CITIES, CityId, type DraftInput, type EntryChoice, type ProgramStop, type Repeat, type SpokenLang, normalizeLangs } from '@ktu/shared';

/**
 * Rules for the "make an event" form. Pure: returns i18n keys, not sentences,
 * so the rules are testable without a language and the screen picks the words.
 */
export type DraftField = 'title' | 'venue' | 'hood' | 'date' | 'tags' | 'price' | 'program';
export type DraftErrorKey = 'err_required' | 'err_title_short' | 'err_date_past' | 'err_tags' | 'err_price' | 'err_program';
export type DraftErrors = Partial<Record<DraftField, DraftErrorKey>>;

export interface DraftForm {
  title: string;
  description: string;
  venue: string;
  city: CityId;
  /** must be one of CITIES[city].areas; cleared when the city changes */
  hood: AreaId | null;
  when: Date | null;
  tags: string;
  price: string;
  photo: string | null;
  /** languages people can use there; starts as Albanian */
  langs: SpokenLang[];
  /** null = it happens once */
  repeat: Repeat | null;
  /** how people get in: anyone / ask the host / ask, and a shared interest lets them in */
  entry: EntryChoice;
  /** 'women' is only offered to a host who is a woman (the store checks again on submit) */
  audience: Audience;
  /** optional programme rows as typed; empty rows are ignored */
  program: ProgramStop[];
}

/**
 * The rows a host filled in, in time order (a stable sort, so two stops at the same minute keep
 * the order they were written). A programme needs a start and an end, so one row alone is an error.
 */
export function cleanProgram(rows: ProgramStop[]): { stops: ProgramStop[]; ok: boolean } {
  const stops = rows
    .map((r) => ({ min: r.min, text: r.text.trim() }))
    .filter((r) => r.text.length > 0)
    .sort((a, b) => a.min - b.min);
  return { stops, ok: stops.length !== 1 };
}

export const TITLE_MIN = 5;
/** Titles show in full on every card (nothing is cut), so the form keeps them card-sized. */
export const TITLE_MAX = 70;
export const TAGS_MAX = 6;

/** "Yoga, Outdoor  Fun" → ["yoga", "outdoor-fun"] */
export function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean);
}

export type ValidationResult = { ok: true; value: DraftInput } | { ok: false; errors: DraftErrors };

export function validateDraft(form: DraftForm, now: Date): ValidationResult {
  const errors: DraftErrors = {};
  const title = form.title.trim();
  const venue = form.venue.trim();

  if (!title) errors.title = 'err_required';
  else if (title.length < TITLE_MIN) errors.title = 'err_title_short';

  if (!venue) errors.venue = 'err_required';
  const hoodValid = !!form.hood && CITIES[form.city].areas.some((a) => a.id === form.hood);
  if (!hoodValid) errors.hood = 'err_required';

  if (!form.when) errors.date = 'err_required';
  else if (form.when.getTime() < now.getTime()) errors.date = 'err_date_past';

  const tags = parseTags(form.tags);
  if (tags.length < 1 || tags.length > TAGS_MAX) errors.tags = 'err_tags';

  let ticketPriceLek: number | undefined;
  const price = form.price.trim();
  if (price) {
    const n = Number(price);
    if (!Number.isInteger(n) || n <= 0) errors.price = 'err_price';
    else ticketPriceLek = n;
  }

  const program = cleanProgram(form.program);
  if (!program.ok) errors.program = 'err_program';

  if (Object.keys(errors).length > 0 || !form.hood || !form.when) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title,
      description: form.description.trim(),
      venueName: venue,
      city: form.city,
      neighborhood: form.hood,
      startsAt: form.when.toISOString(),
      tags,
      languages: normalizeLangs(form.langs),
      ticketPriceLek,
      coverImage: form.photo ?? undefined,
      repeat: form.repeat ?? undefined,
      entry: form.entry,
      audience: form.audience === 'women' ? 'women' : undefined,
      program: program.stops.length > 0 ? program.stops : undefined,
    },
  };
}
