import { Module } from '@nestjs/common';

/**
 * People with an account: profile (name, city, interests, hidden topics, language), role (user / curator / admin), phone verification, account deletion. Synced from Clerk by webhook.
 *
 * Tables: users.
 * Layout (see ARCHITECTURE.md): http/ → application/ → data/, plus jobs/ for scheduled work.
 */
@Module({})
export class UsersModule {}
