import type { INestApplication } from '@nestjs/common';
import type { Env } from './config/env.js';
import { ErrorFilter } from './platform/http/error.filter.js';

/** The base path of every feature endpoint. A breaking change gets /v2 next to it, never an edit in place. */
export const API_PREFIX = 'v1';

/**
 * Everything applied to the HTTP app, in one place, so the server (main.ts) and the tests
 * (test/support/create-test-app.ts) run exactly the same configuration.
 */
export function configureApp(app: INestApplication, env: Env): INestApplication {
  app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });
  app.useGlobalFilters(new ErrorFilter());
  app.enableCors({ origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : false });
  app.enableShutdownHooks();
  return app;
}
