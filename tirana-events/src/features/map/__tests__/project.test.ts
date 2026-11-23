import { CITIES } from '@ktu/shared';
import { MAP_EDGE, MAP_H, MAP_W, project } from '@/features/map/project';

const tirana = CITIES.tirana.bounds;

describe('project', () => {
  it('maps the north-west corner to the top-left, clamped inside the edge', () => {
    expect(project(tirana.latMax, tirana.lngMin, tirana)).toEqual({ x: MAP_EDGE, y: MAP_EDGE });
  });

  it('keeps far-away points on the canvas', () => {
    expect(project(40, 21, tirana)).toEqual({ x: MAP_W - MAP_EDGE, y: MAP_H - MAP_EDGE });
  });

  it('puts Skanderbeg Square roughly in the middle of Tirana', () => {
    const { x, y } = project(41.3275, 19.8187, tirana);
    expect(x).toBeGreaterThan(MAP_W * 0.35);
    expect(x).toBeLessThan(MAP_W * 0.65);
    expect(y).toBeGreaterThan(MAP_H * 0.25);
    expect(y).toBeLessThan(MAP_H * 0.6);
  });

  it('uses each city\'s own bounds', () => {
    const v = CITIES.vlore.bounds;
    const centre = project((v.latMin + v.latMax) / 2, (v.lngMin + v.lngMax) / 2, v);
    expect(centre).toEqual({ x: MAP_W / 2, y: MAP_H / 2 });
  });
});
