import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '@/lib/log';

/**
 * Every read and write of device storage goes through here.
 *
 * - A key that fails to parse or validate is dropped on its own (with a warning),
 *   instead of one bad value wiping every other key's load.
 * - Stored shapes are versioned. When a shape changes: bump SCHEMA_VERSION and add
 *   the step to MIGRATIONS. Steps run once, in order, before anything is read.
 */
const log = createLogger('storage');

export const KEYS = {
  rsvps: 'rsvps',
  profile: 'profile',
  drafts: 'drafts',
  comments: 'comments',
  theme: 'theme',
  lang: 'lang',
} as const;
export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

const VERSION_KEY = 'schemaVersion';
export const SCHEMA_VERSION = 2;

const MIGRATIONS: Record<number, () => Promise<void>> = {
  // 0 → 1: drafts saved before neighbourhoods existed default to the centre.
  1: async () => {
    const drafts = await readJson<Record<string, unknown>[]>(KEYS.drafts, [], asArray);
    if (drafts.length) await writeJson(KEYS.drafts, drafts.map((d) => ({ neighborhood: 'qendra', ...d })));
  },
  // 1 → 2: multi-city. Everything saved before was in Tirana; the profile gets a default city.
  2: async () => {
    const drafts = await readJson<Record<string, unknown>[]>(KEYS.drafts, [], asArray);
    if (drafts.length) await writeJson(KEYS.drafts, drafts.map((d) => ({ city: 'tirana', ...d })));
    const profile = await readJson<Record<string, unknown> | null>(KEYS.profile, null, asRecord);
    if (profile && !profile.city) await writeJson(KEYS.profile, { ...profile, city: 'tirana' });
  },
};

let migration: Promise<void> | null = null;

/** Idempotent: every provider awaits it, the steps run once per app start. */
export function migrateStorage(): Promise<void> {
  migration ??= (async () => {
    try {
      const stored = Number((await AsyncStorage.getItem(VERSION_KEY)) ?? 0);
      for (let v = stored + 1; v <= SCHEMA_VERSION; v++) {
        await MIGRATIONS[v]?.();
        log.info(`migrated storage to v${v}`);
      }
      if (stored !== SCHEMA_VERSION) await AsyncStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
    } catch (e) {
      log.error('storage migration failed', e);
    }
  })();
  return migration;
}

/**
 * Reads a JSON value. `coerce` validates the parsed value and returns null to reject it;
 * rejected or unparsable values fall back and are logged with what was found.
 */
export async function readJson<T>(key: StorageKey, fallback: T, coerce?: (raw: unknown) => T | null): Promise<T> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch (e) {
    log.error(`read "${key}" failed`, e);
    return fallback;
  }
  if (raw == null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    const value = coerce ? coerce(parsed) : (parsed as T);
    if (value == null) {
      log.warn(`dropped invalid "${key}"`, parsed);
      return fallback;
    }
    return value;
  } catch {
    log.warn(`dropped unparsable "${key}"`, raw.slice(0, 200));
    return fallback;
  }
}

export function writeJson(key: StorageKey, value: unknown): Promise<void> {
  return AsyncStorage.setItem(key, JSON.stringify(value)).catch((e) => log.error(`write "${key}" failed`, e));
}

/** Plain string values (theme id, language) are stored unquoted for backwards compatibility. */
export async function readString<T extends string>(key: StorageKey, allowed: readonly T[]): Promise<T | null> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v != null && (allowed as readonly string[]).includes(v) ? (v as T) : null;
  } catch (e) {
    log.error(`read "${key}" failed`, e);
    return null;
  }
}

export function writeString(key: StorageKey, value: string): Promise<void> {
  return AsyncStorage.setItem(key, value).catch((e) => log.error(`write "${key}" failed`, e));
}

/** Debug helper: forget everything this app stored on the device. */
export async function clearStorage(): Promise<void> {
  await AsyncStorage.multiRemove([...Object.values(KEYS), VERSION_KEY]);
  migration = null;
  log.info('cleared local data');
}

// ---- small validators for `coerce` ----

export const isRecord = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

export const asArray = <T>(x: unknown): T[] | null => (Array.isArray(x) ? (x as T[]) : null);

export const asRecord = <T>(x: unknown): T | null => (isRecord(x) ? (x as T) : null);
