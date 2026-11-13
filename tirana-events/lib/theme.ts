import type { Category } from './types';

export const colors = {
  bg: '#0E1116',
  card: '#171C24',
  cardAlt: '#1D232E',
  border: '#2A3240',
  text: '#F2F5F9',
  textDim: '#9AA7B8',
  accent: '#FF5A5F',
  accentSoft: '#3B2528',
  green: '#3DDC97',
  greenSoft: '#1C3630',
  gold: '#F5C84B',
  goldSoft: '#3A3420',
} as const;

export const radius = { sm: 8, md: 14, lg: 20 } as const;

export const CATEGORY_META: Record<Category, { emoji: string; color: string }> = {
  community: { emoji: '🫂', color: '#7FB3FF' },
  music: { emoji: '🎸', color: '#FF5A5F' },
  nightlife: { emoji: '🪩', color: '#B388FF' },
  culture: { emoji: '🎭', color: '#F5C84B' },
  sports: { emoji: '⚽', color: '#3DDC97' },
  business: { emoji: '💼', color: '#8FA3B8' },
  food: { emoji: '🍝', color: '#FF9F5A' },
  outdoors: { emoji: '🌿', color: '#5ED0A5' },
};
