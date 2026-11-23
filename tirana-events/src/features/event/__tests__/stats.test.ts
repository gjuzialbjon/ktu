import { durationMin, formatDuration, programStops, weatherAt } from '@/features/event/stats';
import type { Weather } from '@/features/weather/weather';
import { NOW, at, makeEvent } from '@ktu/shared/testing';

describe('event stats', () => {
  it('takes the duration from the end time, else from the last program stop', () => {
    expect(durationMin(makeEvent({ startsAt: at(1, 20), endsAt: at(1, 22, 30) }))).toBe(150);
    expect(durationMin(makeEvent({ startsAt: at(1, 20), program: [{ min: 0, text: 'a' }, { min: 90, text: 'b' }] }))).toBe(90);
    expect(durationMin(makeEvent({ startsAt: at(1, 20) }))).toBeUndefined();
  });

  it('formats durations like a route app', () => {
    expect(formatDuration(150)).toBe('2h 30m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(45)).toBe('45m');
  });

  it('turns the program into waypoints A, 1, 2 … B with clock times', () => {
    const e = makeEvent({
      startsAt: at(1, 20),
      program: [
        { min: 0, text: 'meet' },
        { min: 30, text: 'eat' },
        { min: 60, text: 'talk' },
        { min: 120, text: 'end' },
      ],
    });
    const stops = programStops(e);
    expect(stops.map((p) => p.mark)).toEqual(['A', '1', '2', 'B']);
    expect(stops[1].at.getHours()).toBe(20);
    expect(stops[1].at.getMinutes()).toBe(30);
  });

  it('gives the weather for the hour an event starts, only inside the forecast window', () => {
    const w = { hours: [{ time: '20:00', temp: 14, kind: 'rain', rainChance: 70 }] } as unknown as Weather;
    const tonight = at(0, 20, 30);
    const soon = new Date(new Date(tonight).getTime() - 3 * 3600_000);
    expect(weatherAt(w, tonight, soon)?.temp).toBe(14);
    expect(weatherAt(w, at(3, 20), NOW)).toBeUndefined();
  });
});
