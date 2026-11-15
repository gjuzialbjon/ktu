import { MAP_BOUNDS, MAP_EDGE, MAP_H, MAP_W, project } from '@/features/map/project';

describe('project', () => {
  it('maps the north-west corner to the top-left, clamped inside the edge', () => {
    expect(project(MAP_BOUNDS.latMax, MAP_BOUNDS.lngMin)).toEqual({ x: MAP_EDGE, y: MAP_EDGE });
  });

  it('keeps far-away points on the canvas', () => {
    const p = project(40, 21);
    expect(p).toEqual({ x: MAP_W - MAP_EDGE, y: MAP_H - MAP_EDGE });
  });

  it('puts Skanderbeg Square roughly in the middle', () => {
    const { x, y } = project(41.3275, 19.8187);
    expect(x).toBeGreaterThan(MAP_W * 0.35);
    expect(x).toBeLessThan(MAP_W * 0.65);
    expect(y).toBeGreaterThan(MAP_H * 0.25);
    expect(y).toBeLessThan(MAP_H * 0.6);
  });
});
