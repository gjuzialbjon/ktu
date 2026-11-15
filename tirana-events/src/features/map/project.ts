import type { MapBounds } from '@/data/cities';

/**
 * Stylized city maps (not to scale). Real lat/lng are projected onto a fixed
 * canvas using each city's bounds, so pins sit roughly where the events are.
 */
export const MAP_W = 360;
export const MAP_H = 420;
/** pins never sit closer than this to the canvas edge, so they stay fully visible */
export const MAP_EDGE = 14;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function project(lat: number, lng: number, b: MapBounds): { x: number; y: number } {
  const x = ((lng - b.lngMin) / (b.lngMax - b.lngMin)) * MAP_W;
  const y = MAP_H - ((lat - b.latMin) / (b.latMax - b.latMin)) * MAP_H;
  return { x: clamp(x, MAP_EDGE, MAP_W - MAP_EDGE), y: clamp(y, MAP_EDGE, MAP_H - MAP_EDGE) };
}
