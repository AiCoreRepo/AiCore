import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { Logger } from '@nestjs/common';

/**
 * Worker Entry Point
 * -------------------------------------------------
 * This starts a HEADLESS NestJS application context:
 *   - NO HTTP server is created (NestFactory.createApplicationContext)
 *   - Only connects to Redis and listens for Bull queue jobs
 *   - Completely separate Node.js process from the API server
 *
 * How it stays inside NestJS but runs separately:
 *   API process  → adds jobs to Redis queue (Bull)
 *   Worker process → picks jobs up from Redis, processes them
 *
 * Start: npm run start:worker  (production)
 *        npm run start:worker:dev  (development with ts-node)
 */
async function bootstrapWorker() {
  const logger = new Logger('WorkerMain');
  logger.log('🔧 Starting Standalone Worker Process...');

  // createApplicationContext = NestJS DI + modules, but NO HTTP server
  const app = await NestFactory.createApplicationContext(WorkerModule);

  // Enable graceful shutdown: running jobs finish cleanly before process exits
  app.enableShutdownHooks();

  logger.log('🚀 Worker connected to Redis — waiting for jobs...');
  logger.log('   Listening for: try-on jobs, angle generation jobs, aura generation jobs');
}

bootstrapWorker();
