import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Category, SpokenLang } from '@/data/types';
import type { AreaId, CityId } from '@/data/cities';
import type { WhenFilter } from '@/lib/format';
import { FeedFilters } from './buildFeed';

export type FilterPanel = 'when' | 'where' | 'more' | null;

/**
 * Filter state for the home feed. The tag lives in the URL (?tag=…) so a tag tapped
 * on an event page lands here filtered, and the web back button undoes it.
 * The area filter remembers its city: after switching city it simply stops applying.
 */
export function useFeedFilters(city: CityId) {
  const router = useRouter();
  const params = useLocalSearchParams<{ tag?: string }>();
  const tag = typeof params.tag === 'string' && params.tag.length > 0 ? params.tag : null;

  const [when, setWhen] = useState<WhenFilter>('all');
  const [area, setArea] = useState<{ city: CityId; id: AreaId } | null>(null);
  const hood = area?.city === city ? area.id : null;
  const setHood = (id: AreaId | null) => setArea(id ? { city, id } : null);
  const [cat, setCat] = useState<Category | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [lang, setLang] = useState<SpokenLang | null>(null);
  const [panel, setPanel] = useState<FilterPanel>(null);

  const filters = useMemo<FeedFilters>(() => ({ when, hood, cat, freeOnly, lang, tag }), [when, hood, cat, freeOnly, lang, tag]);

  const clearTag = () => router.setParams({ tag: '' });

  const reset = () => {
    setWhen('all');
    setHood(null);
    setCat(null);
    setFreeOnly(false);
    setLang(null);
    setPanel(null);
    if (tag) clearTag();
  };

  return {
    filters,
    setWhen,
    setHood,
    setCat,
    setFreeOnly,
    setLang,
    clearTag,
    reset,
    panel,
    togglePanel: (p: Exclude<FilterPanel, null>) => setPanel((cur) => (cur === p ? null : p)),
    closePanel: () => setPanel(null),
  };
}

export type FeedFiltersState = ReturnType<typeof useFeedFilters>;
