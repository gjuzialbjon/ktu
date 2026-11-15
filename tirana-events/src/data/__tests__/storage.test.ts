import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS, SCHEMA_VERSION, asArray, clearStorage, migrateStorage, readJson, readString } from '@/data/storage';

beforeEach(async () => {
  await AsyncStorage.clear();
  await clearStorage(); // also resets the run-once migration guard
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('readJson', () => {
  it('returns the fallback for a missing key', async () => {
    expect(await readJson(KEYS.rsvps, { none: true })).toEqual({ none: true });
  });

  it('drops a corrupt value instead of throwing', async () => {
    await AsyncStorage.setItem(KEYS.comments, '{not json');
    expect(await readJson(KEYS.comments, [], asArray)).toEqual([]);
    expect(console.warn).toHaveBeenCalled();
  });

  it('rejects a value of the wrong shape', async () => {
    await AsyncStorage.setItem(KEYS.drafts, '{"oops":1}');
    expect(await readJson(KEYS.drafts, [], asArray)).toEqual([]);
  });
});

describe('readString', () => {
  it('only returns allowed values', async () => {
    await AsyncStorage.setItem(KEYS.lang, 'fr');
    expect(await readString(KEYS.lang, ['sq', 'en'])).toBeNull();
    await AsyncStorage.setItem(KEYS.lang, 'en');
    expect(await readString(KEYS.lang, ['sq', 'en'])).toBe('en');
  });
});

describe('migrateStorage', () => {
  it('moves pre-city data to Tirana and gives the profile a city', async () => {
    await AsyncStorage.setItem(KEYS.drafts, JSON.stringify([{ id: 'd1', neighborhood: 'blloku' }]));
    await AsyncStorage.setItem(KEYS.profile, JSON.stringify({ name: 'Ana', follows: [] }));
    await migrateStorage();
    expect(await readJson(KEYS.drafts, [])).toEqual([{ city: 'tirana', id: 'd1', neighborhood: 'blloku' }]);
    expect(await readJson(KEYS.profile, null)).toEqual({ name: 'Ana', follows: [], city: 'tirana' });
  });

  it('leaves data already on the current version alone', async () => {
    await AsyncStorage.setItem('schemaVersion', String(SCHEMA_VERSION));
    await AsyncStorage.setItem(KEYS.profile, JSON.stringify({ name: 'Ana', follows: [], city: 'korce' }));
    await migrateStorage();
    expect(await readJson(KEYS.profile, null)).toEqual({ name: 'Ana', follows: [], city: 'korce' });
  });

  it('gives old drafts a neighbourhood and records the version', async () => {
    await AsyncStorage.setItem(KEYS.drafts, JSON.stringify([{ id: 'd1' }, { id: 'd2', neighborhood: 'blloku' }]));
    await migrateStorage();
    expect(await readJson(KEYS.drafts, [])).toEqual([
      { city: 'tirana', neighborhood: 'qendra', id: 'd1' },
      { city: 'tirana', neighborhood: 'blloku', id: 'd2' },
    ]);
    expect(await AsyncStorage.getItem('schemaVersion')).toBe(String(SCHEMA_VERSION));
  });
});
