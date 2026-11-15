import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Category, Neighborhood } from '@/data/types';
import type { WhenFilter } from '@/lib/format';
import { FeedFilters } from './buildFeed';

export type FilterPanel = 'where' | 'more' | null;

/**
 * Filter state for the home feed. The tag lives in the URL (?tag=…) so a tag tapped
 * on an event page lands here filtered, and the web back button undoes it.
 */
export function useFeedFilters() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tag?: string }>();
  const tag = typeof params.tag === 'string' && params.tag.length > 0 ? params.tag : null;

  const [when, setWhen] = useState<WhenFilter>('all');
  const [hood, setHood] = useState<Neighborhood | null>(null);
  const [cat, setCat] = useState<Category | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [panel, setPanel] = useState<FilterPanel>(null);

  const filters = useMemo<FeedFilters>(() => ({ when, hood, cat, freeOnly, tag }), [when, hood, cat, freeOnly, tag]);

  const clearTag = () => router.setParams({ tag: '' });

  const reset = () => {
    setWhen('all');
    setHood(null);
    setCat(null);
    setFreeOnly(false);
    setPanel(null);
    if (tag) clearTag();
  };

  return {
    filters,
    setWhen,
    setHood,
    setCat,
    setFreeOnly,
    clearTag,
    reset,
    panel,
    togglePanel: (p: Exclude<FilterPanel, null>) => setPanel((cur) => (cur === p ? null : p)),
    closePanel: () => setPanel(null),
  };
}

export type FeedFiltersState = ReturnType<typeof useFeedFilters>;
