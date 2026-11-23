import { Module } from '@nestjs/common';

/**
 * Reports from users ("not as described", "host didn't show", spam) and the curator decisions on them.
 *
 * Tables: reports.
 * Layout (see ARCHITECTURE.md): http/ → application/ → data/, plus jobs/ for scheduled work.
 */
@Module({})
export class ModerationModule {}
