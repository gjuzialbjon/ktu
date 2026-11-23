import { z } from 'zod';

/**
 * Every setting the backend reads, validated once at startup. A missing or malformed value
 * stops the process with a clear message instead of failing later on a request.
 * Read settings through the ENV provider (config.module.ts), never process.env directly.
 */
const list = z
  .string()
  .default('')
  .transform((s) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  );

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CORS_ORIGINS: list,
    /** Postgres connection string (Neon). Empty: embedded PGlite (development and tests only). */
    DATABASE_URL: z.url().optional().or(z.literal('').transform(() => undefined)),
    /** Where the embedded PGlite database lives in development; tests always use memory. */
    PGLITE_DIR: z.string().default('./.data/pglite'),
  })
  .refine((e) => e.NODE_ENV !== 'production' || !!e.DATABASE_URL, {
    message: 'DATABASE_URL is required in production',
    path: ['DATABASE_URL'],
  });

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment:\n${problems}`);
  }
  return parsed.data;
}
