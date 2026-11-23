import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/bootstrap.js';
import { ENV } from '../../src/config/config.module.js';
import type { Env } from '../../src/config/env.js';

export interface TestApp {
  app: INestApplication;
  /** base URL of the running test server, e.g. http://127.0.0.1:54321 */
  url: string;
  close: () => Promise<void>;
}

/**
 * The real app (same modules, same HTTP configuration) on a random port, with an
 * in-memory PGlite database that disappears when the test ends.
 */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app, app.get<Env>(ENV));
  await app.listen(0, '127.0.0.1');
  const url = await app.getUrl();
  return { app, url: url.replace('[::1]', '127.0.0.1'), close: () => app.close() };
}
