import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Category } from './types';

export type ThemeId = 'nata' | 'liqeni' | 'fasadat';

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
  /** Main actions: join, submit. */
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
  dark: boolean;
  c: Palette;
  cat: Record<Category, string>;
  /** Display face for headings only; body text stays on the system font. */
  font: string;
  /** Card outline width: graphic themes draw bolder outlines. */
  outline: number;
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

export const THEMES: Record<ThemeId, Theme> = {
  // Night out: dark violet city, lit windows. Yellow drives actions, pink is only for people.
  nata: {
    id: 'nata',
    dark: true,
    font: 'BricolageGrotesque_800ExtraBold',
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
    map: { ground: '#1D1733', park: '#1E3A33', water: '#173450', road: '#382E5A', label: '#B8AED6' },
    band: { blocks: ['#231B3D', '#2A2149', '#1F1836', '#30265A'], window: '#FFD25A', windowOff: '#2F2650', sun: '#FFF3C4' },
  },

  // Lake mornings, komoot-like: light, outdoors greens, lake blue for people.
  liqeni: {
    id: 'liqeni',
    dark: false,
    font: 'Fraunces_700Bold',
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
    map: { ground: '#F4FAF6', park: '#CBE6D3', water: '#A9D3EC', road: '#C3D9CB', label: '#46604F' },
    band: { blocks: ['#BFD9C9', '#A9CDB8', '#CFE3D7', '#B5D3E3'], window: '#FFFFFF', windowOff: '#E3F0E8', sun: '#FFC94D', water: '#7FB6D9' },
  },

  // Tirana's painted facades: concrete gray base, bold paint blocks, black graphic outlines.
  fasadat: {
    id: 'fasadat',
    dark: false,
    font: 'Unbounded_700Bold',
    outline: 2,
    c: {
      bg: '#E4E6E9',
      surface: '#FFFFFF',
      surfaceAlt: '#D3D7DC',
      border: '#17191E',
      text: '#17191E',
      textDim: '#4A5260',
      social: '#D12F6A',
      onSocial: '#FFFFFF',
      primary: '#17191E',
      onPrimary: '#FFD23F',
      free: '#3FA34D',
      onFree: '#0F2A14',
      sponsored: '#FFD23F',
      onSponsored: '#17191E',
      danger: '#C62828',
    },
    cat: {
      community: '#1FA5A0',
      music: '#8A4FD1',
      nightlife: '#2E6FD8',
      culture: '#F2C230',
      sports: '#E0412F',
      business: '#6B7280',
      food: '#F07A23',
      outdoors: '#3FA34D',
    },
    map: { ground: '#F2F3F5', park: '#BFE0C4', water: '#9CC7F0', road: '#17191E', label: '#4A5260' },
    band: {
      blocks: ['#F2C230', '#2E6FD8', '#E0412F', '#3FA34D', '#8A4FD1', '#F07A23', '#1FA5A0', '#E85AA0'],
      window: '#FFFFFF',
      windowOff: 'rgba(23,25,30,0.25)',
    },
  },
};

export const THEME_ORDER: ThemeId[] = ['nata', 'liqeni', 'fasadat'];

interface ThemeCtx extends Theme {
  setThemeId: (id: ThemeId) => void;
  cycleTheme: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<ThemeId>('nata');

  useEffect(() => {
    AsyncStorage.getItem('theme')
      .then((v) => {
        if (v === 'nata' || v === 'liqeni' || v === 'fasadat') setId(v);
      })
      .catch(() => {});
  }, []);

  const value = useMemo<ThemeCtx>(() => {
    const setThemeId = (next: ThemeId) => {
      setId(next);
      AsyncStorage.setItem('theme', next).catch(() => {});
    };
    return {
      ...THEMES[id],
      setThemeId,
      cycleTheme: () => setThemeId(THEME_ORDER[(THEME_ORDER.indexOf(id) + 1) % THEME_ORDER.length]),
    };
  }, [id]);

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
