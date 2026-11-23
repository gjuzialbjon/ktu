import { Module } from '@nestjs/common';

/**
 * People and taste: follows, likes, saves, and who you know is going to an event.
 *
 * Tables: follows, likes, saves.
 * Layout (see ARCHITECTURE.md): http/ → application/ → data/, plus jobs/ for scheduled work.
 */
@Module({})
export class SocialModule {}
