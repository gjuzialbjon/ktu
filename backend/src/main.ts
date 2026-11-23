import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap.js';
import { ENV } from './config/config.module.js';
import type { Env } from './config/env.js';

async function main(): Promise<void> {
  // .env is optional (development); real deployments set variables in the host's dashboard
  if (existsSync('.env')) process.loadEnvFile('.env');
  const app = await NestFactory.create(AppModule);
  const env = app.get<Env>(ENV);
  configureApp(app, env);
  await app.listen(env.PORT);
  new Logger('bootstrap').log(`API on http://localhost:${env.PORT} (${env.NODE_ENV}, database: ${env.DATABASE_URL ? 'postgres' : 'pglite'})`);
}

void main();
