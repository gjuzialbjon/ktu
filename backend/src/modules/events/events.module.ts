import { Module } from '@nestjs/common';

/**
 * Events and repeating series: the public feed (with hidden details stripped by @ktu/shared access rules), event pages, creating and editing, cancelling, the curator review queue, and the job that creates the next edition of a series.
 *
 * Tables: events, series.
 * Layout (see ARCHITECTURE.md): http/ → application/ → data/, plus jobs/ for scheduled work.
 */
@Module({})
export class EventsModule {}
