import { mkdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import type { Env } from '../../config/env.js';
import * as schema from './schema.js';

export type Schema = typeof schema;

/** The database as every repository sees it, whichever driver is underneath. */
export type Db = PgDatabase<PgQueryResultHKT, Schema>;

export interface DatabaseHandle {
  db: Db;
  driver: 'postgres' | 'pglite';
  close: () => Promise<void>;
}

/** Column names are written camelCase in TypeScript and stored snake_case in Postgres. */
const options = { schema, casing: 'snake_case' as const };

/**
 * Postgres when DATABASE_URL is set (Neon in staging and production). Otherwise PGlite, a real
 * Postgres compiled to WebAssembly: in memory for tests, on disk in development, so the
 * backend runs with no account and no Docker.
 */
export function openDatabase(env: Env): DatabaseHandle {
  if (env.DATABASE_URL) {
    const client = postgres(env.DATABASE_URL, { max: 10 });
    return {
      db: drizzlePostgres(client, options) as unknown as Db,
      driver: 'postgres',
      close: () => client.end(),
    };
  }
  const dir = env.NODE_ENV === 'test' ? undefined : env.PGLITE_DIR;
  if (dir) mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  return {
    db: drizzlePglite(client, options) as unknown as Db,
    driver: 'pglite',
    close: () => client.close(),
  };
}
