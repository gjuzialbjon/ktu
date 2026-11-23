/**
 * Every table in the database, gathered from the modules that own them.
 * Each module keeps its tables in `modules/<module>/data/*.table.ts` and adds one export line
 * here; this file only collects them, so Drizzle's typed queries and relations see the
 * whole schema. drizzle-kit reads the module files directly (drizzle.config.ts).
 */
export {};
