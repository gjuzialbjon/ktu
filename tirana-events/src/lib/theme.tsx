import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Category } from '@ktu/shared';
import { KEYS, migrateStorage, readString, writeString } from '@/data/storage';

export type ThemeId = 'agimi' | 'muzgu' | 'liqeni' | 'nata';

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textDim: string;
  /** Reserved for people: friends going, followed avatars. Nothing else. */
  social: string;
  onSocial: string;
  /** Main actions: join, submit, the create button. */
  primary: string;
  onPrimary: string;
  free: string;
  onFree: string;
  sponsored: string;
  onSponsored: string;
  danger: string;
}

export interface Theme {
  id: ThemeId;
  /** Nata is the one dark theme; the other three are light, their evening a warm sky. */
  dark: boolean;
  c: Palette;
  cat: Record<Category, string>;
  /** Display face for headings. */
  font: string;
  /** Handwritten face, used sparingly on key words in app copy (never on event copy). */
  hand: string;
  /** Card outline width. */
  outline: number;
  /**
   * The feed's sky: as you scroll from today's early events to the late ones, the
   * background fades from `day` to `evening`. Kept subtle; it is a mood, not a picture.
   */
  sky: { day: [string, string]; evening: [string, string] };
  /** Paper colours for handwritten stickers. */
  sticker: string[];
  map: { ground: string; park: string; water: string; road: string; label: string };
  band: { blocks: string[]; window: string; windowOff: string; sun?: string; water?: string };
}

export const CATEGORY_EMOJI: Record<Category, string> = {
  community: '🫂',
  music: '🎸',
  nightlife: '🪩',
  culture: '🎭',
  sports: '⚽',
  business: '💼',
  food: '🍝',
  outdoors: '🌿',
};

export const radius = { sm: 10, md: 16, lg: 22 } as const;

/** 4-unit spacing scale: tight inside groups, generous between sections. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

/** "#RRGGBB" + alpha → "rgba(...)". For layers that let the sky show through. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/**
 * Young Serif for headings (one weight; its figures are old-style, so times, prices and
 * stats use the body face); Onest for everything else, set by components/Text; Caveat for
 * the few handwritten notes.
 */
export const FONTS = {
  heading: 'YoungSerif_400Regular',
  hand: 'Caveat_700Bold',
} as const;

/** Onest by weight; components/Text picks the file from a style's fontWeight. */
export const BODY_FONT = {
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  semibold: 'Onest_600SemiBold',
  bold: 'Onest_700Bold',
} as const;

export const THEMES: Record<ThemeId, Theme> = {
  // Early morning over Dajti: pale sky, apricot sun on the buttons, ink-navy text.
  agimi: {
    id: 'agimi',
    dark: false,
    font: FONTS.heading,
    hand: FONTS.hand,
    outline: 1,
    c: {
      bg: '#EEF3FA',
      surface: '#FFFFFF',
      surfaceAlt: '#E1E9F4',
      border: '#CAD6E6',
      text: '#1B2340',
      textDim: '#535E7C',
      social: '#5163E8',
      onSocial: '#FFFFFF',
      primary: '#FF9248',
      onPrimary: '#1B2340',
      free: '#C6EEDA',
      onFree: '#0D5234',
      sponsored: '#FFE7A6',
      onSponsored: '#5C4300',
      danger: '#C0392B',
    },
    cat: {
      community: '#5B8DEF',
      music: '#9A6BE8',
      nightlife: '#6A5AD6',
      culture: '#E8A93A',
      sports: '#3DAA74',
      business: '#7385A0',
      food: '#F2804A',
      outdoors: '#2BA58A',
    },
    sky: { day: ['#EEF3FA', '#F7F0EC'], evening: ['#F8DCD3', '#E3D6F3'] },
    sticker: ['#FFE07A', '#FFC2D1', '#BDEFD8', '#C6DCFF'],
    map: { ground: '#F7FAFE', park: '#D3EDDC', water: '#B7D8F2', road: '#CAD6E6', label: '#535E7C' },
    band: { blocks: ['#C9D7EC', '#D8CDEB', '#F3D2C4', '#BFD8E8'], window: '#FFFFFF', windowOff: '#E6EDF6', sun: '#FFB86B' },
  },

  // Sunset on the boulevard: apricot glow, rose actions, plum ink. Warm, never dark.
  muzgu: {
    id: 'muzgu',
    dark: false,
    font: FONTS.heading,
    hand: FONTS.hand,
    outline: 1,
    c: {
      bg: '#FCEBE1',
      surface: '#FFF9F5',
      surfaceAlt: '#F7DCCD',
      border: '#EBC3AE',
      text: '#3A1C2C',
      textDim: '#7A5062',
      social: '#3567B8',
      onSocial: '#FFFFFF',
      primary: '#C9366E',
      onPrimary: '#FFFFFF',
      free: '#CDEFD9',
      onFree: '#14512F',
      sponsored: '#FFE2A0',
      onSponsored: '#5C3B00',
      danger: '#B3261E',
    },
    cat: {
      community: '#4F7FD6',
      music: '#8E4FC9',
      nightlife: '#5E46B8',
      culture: '#D99A1E',
      sports: '#2F9A64',
      business: '#7A6F86',
      food: '#E26A3A',
      outdoors: '#24917A',
    },
    sky: { day: ['#FCEBE1', '#FBE3D6'], evening: ['#F5CBD3', '#D9C6EE'] },
    sticker: ['#FFD36E', '#FFB0C4', '#C3EBD3', '#D7C8FF'],
    map: { ground: '#FFF6F0', park: '#D8EBD5', water: '#BFD6F0', road: '#EBC3AE', label: '#7A5062' },
    band: { blocks: ['#F2C2B0', '#E5B3C8', '#F7D3A8', '#D4BCE6'], window: '#FFF6E6', windowOff: '#F7E1D6', sun: '#FF8F5A' },
  },

  // Lake mornings: light, outdoors greens, lake blue for people.
  liqeni: {
    id: 'liqeni',
    dark: false,
    font: FONTS.heading,
    hand: FONTS.hand,
    outline: 1,
    c: {
      bg: '#EAF3EE',
      surface: '#FFFFFF',
      surfaceAlt: '#DCEBE2',
      border: '#C3D9CB',
      text: '#10261A',
      textDim: '#46604F',
      social: '#1D6FB8',
      onSocial: '#FFFFFF',
      primary: '#2E7D4F',
      onPrimary: '#FFFFFF',
      free: '#CDEBD8',
      onFree: '#14512F',
      sponsored: '#FFF1C7',
      onSponsored: '#6B4E00',
      danger: '#C0392B',
    },
    cat: {
      community: '#3D7FD9',
      music: '#8E5BD9',
      nightlife: '#5B4FC7',
      culture: '#D9A21E',
      sports: '#2FA36B',
      business: '#6B7F94',
      food: '#E07B2E',
      outdoors: '#1F9C7A',
    },
    sky: { day: ['#EAF3EE', '#EEF4E8'], evening: ['#F6E0CC', '#D9D8EE'] },
    sticker: ['#FFE38A', '#FFC9C2', '#BFE8CF', '#BFDDF2'],
    map: { ground: '#F4FAF6', park: '#CBE6D3', water: '#A9D3EC', road: '#C3D9CB', label: '#46604F' },
    band: { blocks: ['#BFD9C9', '#A9CDB8', '#CFE3D7', '#B5D3E3'], window: '#FFFFFF', windowOff: '#E3F0E8', sun: '#FFC94D', water: '#7FB6D9' },
  },

  // Night out: dark violet city, lit windows. Yellow drives actions, pink is only for people.
  nata: {
    id: 'nata',
    dark: true,
    font: FONTS.heading,
    hand: FONTS.hand,
    outline: 1,
    c: {
      bg: '#140F24',
      surface: '#1D1733',
      surfaceAlt: '#272043',
      border: '#382E5A',
      text: '#FBF8FF',
      textDim: '#B8AED6',
      social: '#FF5C97',
      onSocial: '#140F24',
      primary: '#FFD25A',
      onPrimary: '#140F24',
      free: '#3DDC97',
      onFree: '#0B2A1D',
      sponsored: '#3B3150',
      onSponsored: '#FFD25A',
      danger: '#FF6B6B',
    },
    cat: {
      community: '#7FB3FF',
      music: '#B98BFF',
      nightlife: '#6FD3FF',
      culture: '#FFB86B',
      sports: '#A6E05E',
      business: '#9FB4CC',
      food: '#E9C46A',
      outdoors: '#5EE0B0',
    },
    // later in the evening the violet deepens towards plum
    sky: { day: ['#140F24', '#17112A'], evening: ['#1D1232', '#26133A'] },
    // stickers stay light paper with dark ink, like the lit windows
    sticker: ['#FFD25A', '#FF9EC0', '#8FEBC4', '#B9C8FF'],
    map: { ground: '#1D1733', park: '#1E3A33', water: '#173450', road: '#382E5A', label: '#B8AED6' },
    band: { blocks: ['#231B3D', '#2A2149', '#1F1836', '#30265A'], window: '#FFD25A', windowOff: '#2F2650', sun: '#FFF3C4' },
  },
};

/** Agimi (early morning) leads; Muzgu, Liqeni and Nata are alternatives. Older saved ids fall back here. */
export const DEFAULT_THEME: ThemeId = 'agimi';
export const THEME_ORDER: ThemeId[] = ['agimi', 'muzgu', 'liqeni', 'nata'];

interface ThemeCtx extends Theme {
  setThemeId: (id: ThemeId) => void;
  cycleTheme: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<ThemeId>(DEFAULT_THEME);
  // Hold the first paint until the saved theme is known, so a Muzgu, Liqeni or Nata
  // user never sees a flash of the default palette.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    migrateStorage()
      .then(() => readString(KEYS.theme, THEME_ORDER))
      .then((v) => {
        if (v) setId(v);
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<ThemeCtx>(() => {
    const setThemeId = (next: ThemeId) => {
      setId(next);
      writeString(KEYS.theme, next);
    };
    return {
      ...THEMES[id],
      setThemeId,
      cycleTheme: () => setThemeId(THEME_ORDER[(THEME_ORDER.indexOf(id) + 1) % THEME_ORDER.length]),
    };
  }, [id]);

  if (!ready) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme outside ThemeProvider');
  return v;
}

/** Style hook factory: styles are rebuilt only when the theme changes. */
export function makeStyles<T>(factory: (t: Theme) => T): () => T {
  return function useStyles(): T {
    const t = useTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(() => factory(t), [t.id]);
  };
}
