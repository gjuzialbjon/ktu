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
  it('gives old drafts a neighbourhood and records the version', async () => {
    await AsyncStorage.setItem(KEYS.drafts, JSON.stringify([{ id: 'd1' }, { id: 'd2', neighborhood: 'blloku' }]));
    await migrateStorage();
    expect(await readJson(KEYS.drafts, [])).toEqual([
      { neighborhood: 'qendra', id: 'd1' },
      { neighborhood: 'blloku', id: 'd2' },
    ]);
    expect(await AsyncStorage.getItem('schemaVersion')).toBe(String(SCHEMA_VERSION));
  });
});
