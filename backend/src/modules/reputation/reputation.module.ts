import { Module } from '@nestjs/common';

/**
 * Host standing: grades each finished or cancelled event and keeps every host's tier (rules in @ktu/shared hostStanding), read by the feed to rank hosts.
 *
 * Tables: event_outcomes, host_standings.
 * Layout (see ARCHITECTURE.md): http/ → application/ → data/, plus jobs/ for scheduled work.
 */
@Module({})
export class ReputationModule {}
