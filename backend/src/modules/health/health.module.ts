import { Module } from '@nestjs/common';
import { HealthService } from './application/health.service.js';
import { HealthRepository } from './data/health.repository.js';
import { HealthController } from './http/health.controller.js';

@Module({
  controllers: [HealthController],
  providers: [HealthService, HealthRepository],
})
export class HealthModule {}
