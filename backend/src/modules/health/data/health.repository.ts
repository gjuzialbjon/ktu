import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DB } from '../../../platform/database/database.module.js';
import type { Db } from '../../../platform/database/database.js';

@Injectable()
export class HealthRepository {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** true when the database answers a trivial query */
  async ping(): Promise<boolean> {
    try {
      await this.db.execute(sql`select 1`);
      return true;
    } catch {
      return false;
    }
  }
}
