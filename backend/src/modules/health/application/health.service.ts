import { Injectable } from '@nestjs/common';
import { HealthRepository } from '../data/health.repository.js';

export interface HealthReport {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
}

@Injectable()
export class HealthService {
  constructor(private readonly repo: HealthRepository) {}

  async check(): Promise<HealthReport> {
    const up = await this.repo.ping();
    return { status: up ? 'ok' : 'degraded', database: up ? 'up' : 'down' };
  }
}
