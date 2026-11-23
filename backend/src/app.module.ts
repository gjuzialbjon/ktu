import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './platform/database/database.module.js';
import { AttendanceModule } from './modules/attendance/index.js';
import { CommentsModule } from './modules/comments/index.js';
import { EventsModule } from './modules/events/index.js';
import { HealthModule } from './modules/health/index.js';
import { HostsModule } from './modules/hosts/index.js';
import { MediaModule } from './modules/media/index.js';
import { ModerationModule } from './modules/moderation/index.js';
import { NotificationsModule } from './modules/notifications/index.js';
import { ReputationModule } from './modules/reputation/index.js';
import { SocialModule } from './modules/social/index.js';
import { UsersModule } from './modules/users/index.js';

@Module({
  imports: [
    // platform: global, available to every module
    ConfigModule,
    DatabaseModule,
    // features
    HealthModule,
    UsersModule,
    HostsModule,
    EventsModule,
    AttendanceModule,
    SocialModule,
    CommentsModule,
    ReputationModule,
    ModerationModule,
    MediaModule,
    NotificationsModule,
  ],
})
export class AppModule {}
