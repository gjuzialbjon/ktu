import { bucketOf, initials, isThisWeek, joinNames, lekToEur, matchesWhen } from '@/lib/format';
import { NOW, at } from '@ktu/shared/testing';

describe('bucketOf', () => {
  it('puts each moment in exactly one section', () => {
    expect(bucketOf(at(0, 20), NOW)).toBe('today');
    expect(bucketOf(at(1, 9), NOW)).toBe('tomorrow');
    expect(bucketOf(at(3, 22), NOW)).toBe('weekend'); // Saturday
    expect(bucketOf(at(7, 19), NOW)).toBe('later'); // next Wednesday
  });

  it('keeps an event that started under an hour ago, drops older ones', () => {
    expect(bucketOf(at(0, 11, 30), NOW)).toBe('today');
    expect(bucketOf(at(0, 10, 30), NOW)).toBe('past');
  });

  it('counts Friday evening as weekend, Friday afternoon not', () => {
    expect(bucketOf(at(2, 18), NOW)).toBe('weekend');
    expect(bucketOf(at(2, 14), NOW)).toBe('later');
  });
});

describe('matchesWhen', () => {
  it('"all" matches anything not over', () => {
    expect(matchesWhen(at(5, 10), 'all', NOW)).toBe(true);
    expect(matchesWhen(at(-1, 10), 'all', NOW)).toBe(false);
  });

  it('"weekend" only covers the coming weekend', () => {
    expect(matchesWhen(at(3, 12), 'weekend', NOW)).toBe(true);
    expect(matchesWhen(at(10, 12), 'weekend', NOW)).toBe(false); // the one after
  });
});

describe('isThisWeek', () => {
  it('is the next seven days', () => {
    expect(isThisWeek(at(6, 12), NOW)).toBe(true);
    expect(isThisWeek(at(8, 12), NOW)).toBe(false);
  });
});

describe('small formatters', () => {
  it('joins names like people say them', () => {
    expect(joinNames([], 'dhe')).toBe('');
    expect(joinNames(['Elisa'], 'dhe')).toBe('Elisa');
    expect(joinNames(['Elisa', 'Gent'], 'dhe')).toBe('Elisa dhe Gent');
    expect(joinNames(['Elisa', 'Gent', 'Ana', 'Ben'], 'dhe')).toBe('Elisa, Gent +2');
  });

  it('makes two-letter initials', () => {
    expect(initials('Elisa Hoxha')).toBe('EH');
    expect(initials('gent')).toBe('G');
  });

  it('rounds lek to whole euros, at least 1', () => {
    expect(lekToEur(700)).toBe(7);
    expect(lekToEur(20)).toBe(1);
  });
});
