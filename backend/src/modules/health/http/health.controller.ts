import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { type HealthReport, HealthService } from '../application/health.service.js';

/** For the host's uptime checks; outside the /v1 prefix so it never changes with API versions. */
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async get(): Promise<HealthReport> {
    const report = await this.health.check();
    if (report.status !== 'ok') throw new ServiceUnavailableException({ code: 'unhealthy', message: 'Database unreachable.' });
    return report;
  }
}
