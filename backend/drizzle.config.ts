import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

if (existsSync('.env')) process.loadEnvFile('.env');

/**
 * Each module owns its tables in `src/modules/<module>/data/*.table.ts`; drizzle-kit reads
 * them all and writes SQL migrations to ./drizzle (committed). Without DATABASE_URL the
 * commands run against the local PGlite database in ./.data/pglite.
 */
const url = process.env.DATABASE_URL;

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/*/data/*.table.ts',
  out: './drizzle',
  casing: 'snake_case',
  strict: true,
  ...(url ? { dbCredentials: { url } } : { driver: 'pglite', dbCredentials: { url: './.data/pglite' } }),
});
