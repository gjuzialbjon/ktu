import { Module } from '@nestjs/common';

/**
 * Who is coming: going, reserving with a door code, asking to join, the host accepting or declining, cancelling, and "my plans".
 *
 * Tables: rsvps.
 * Layout (see ARCHITECTURE.md): http/ → application/ → data/, plus jobs/ for scheduled work.
 */
@Module({})
export class AttendanceModule {}
