import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ENV } from '../../config/config.module.js';
import type { Env } from '../../config/env.js';
import { type DatabaseHandle, openDatabase } from './database.js';

/** Injection token for the Drizzle database: `constructor(@Inject(DB) db: Db)`. Repositories only. */
export const DB = Symbol('DB');
const HANDLE = Symbol('DB_HANDLE');

@Global()
@Module({
  providers: [
    { provide: HANDLE, inject: [ENV], useFactory: (env: Env) => openDatabase(env) },
    { provide: DB, inject: [HANDLE], useFactory: (h: DatabaseHandle) => h.db },
  ],
  exports: [DB],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(HANDLE) private readonly handle: DatabaseHandle) {}

  async onApplicationShutdown(): Promise<void> {
    await this.handle.close();
  }
}
