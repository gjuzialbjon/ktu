import { AreaId, CITIES, CityId } from '@/data/cities';
import type { DraftInput } from '@/data/events';
import type { Repeat, SpokenLang } from '@/data/types';
import { normalizeLangs } from '@/data/languages';

/**
 * Rules for the "make an event" form. Pure: returns i18n keys, not sentences,
 * so the rules are testable without a language and the screen picks the words.
 */
export type DraftField = 'title' | 'venue' | 'hood' | 'date' | 'tags' | 'price';
export type DraftErrorKey = 'err_required' | 'err_title_short' | 'err_date_past' | 'err_tags' | 'err_price';
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
}

export const TITLE_MIN = 5;
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
    },
  };
}
