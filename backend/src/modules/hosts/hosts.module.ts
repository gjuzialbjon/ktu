import { Module } from '@nestjs/common';

/**
 * Who runs events: organizers, venues imported by the team, and the platform itself. Ownership, verification, the host profile.
 *
 * Tables: hosts.
 * Layout (see ARCHITECTURE.md): http/ → application/ → data/, plus jobs/ for scheduled work.
 */
@Module({})
export class HostsModule {}
