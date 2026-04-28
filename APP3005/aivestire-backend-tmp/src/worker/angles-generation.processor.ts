import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import type bull from 'bull';
import { AngleGenerationService } from '../angles-generation/services/angle-generation.service';
import { AngleGenerationJobData } from '../queues/angle-queue.service';
import { JOB_NAMES, QUEUE_NAMES } from '../common/constants/queue.constants';

@Injectable()
@Processor(QUEUE_NAMES.ANGLES_GENERATION)
export class AnglesGenerationProcessor {
  private readonly logger = new Logger(AnglesGenerationProcessor.name);
  private readonly timingLogsEnabled =
    String(process.env.AI_TIMING_LOGS || '').toLowerCase() === 'true';

  constructor(private readonly angleGenerationService: AngleGenerationService) {}

  @Process({
    name: JOB_NAMES.PROCESS_ANGLE_GENERATION,
    concurrency: 4,
  })
  async handleAngleGeneration(job: bull.Job<AngleGenerationJobData>) {
    const data = job.data;
    const startedAt = Date.now();
    await job.progress(10);

    if (data.type !== 'angle-generation') {
      throw new Error('Invalid angle-generation job payload');
    }

    this.logger.log(
      `Starting queued angle generation for user ${data.requestUserId}`,
    );

    try {
      const result = await this.angleGenerationService.generateAngle(data.request);
      await job.progress(100);
      this.logTiming(
        `jobId=${job.id} type=angle-generation total=${this.formatDuration(Date.now() - startedAt)} status=success`,
      );
      return result;
    } catch (error) {
      this.logTiming(
        `jobId=${job.id} type=angle-generation total=${this.formatDuration(Date.now() - startedAt)} status=failed error=${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw error;
    }
  }

  private logTiming(message: string): void {
    if (!this.timingLogsEnabled) return;
    this.logger.log(`[AngleTiming] ${message}`);
  }

  private formatDuration(durationMs: number): string {
    return `${durationMs}ms/${(durationMs / 1000).toFixed(2)}s`;
  }
}