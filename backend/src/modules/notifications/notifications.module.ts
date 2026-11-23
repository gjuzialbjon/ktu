import { Module } from '@nestjs/common';

/**
 * Push: device tokens and the messages people get (tomorrow, changed, cancelled, request accepted).
 *
 * Tables: push_tokens.
 * Layout (see ARCHITECTURE.md): http/ → application/ → data/, plus jobs/ for scheduled work.
 */
@Module({})
export class NotificationsModule {}
