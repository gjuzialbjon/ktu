import { Module } from '@nestjs/common';

/**
 * Photos: signed upload URLs to object storage (Cloudflare R2) for event covers and avatars, size and type limits.
 *
 * Tables: (none: files live in R2).
 * Layout (see ARCHITECTURE.md): http/ → application/ → data/, plus jobs/ for scheduled work.
 */
@Module({})
export class MediaModule {}
