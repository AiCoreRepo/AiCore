import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { AIProvider } from '../ai-tryon/enums/ai-provider.enum';
import {
  JOB_NAMES,
  JOB_STATUS,
  JobStatus,
  QUEUE_NAMES,
} from '../common/constants/queue.constants';
import { TryOnResponseDto } from '../ai-tryon/dto/tryon-response.dto';

export interface DirectTryOnJobData {
  type: 'direct';
  provider: AIProvider;
  requestUserId: string;
  avatarImage: string;
  clothingImage: string;
  additionalParams?: Record<string, any>;
  guestAvatarFirst?: boolean;
  productId?: string;
  auraId?: string;
}

export type TryOnJobData = DirectTryOnJobData;

export interface TryOnJobStatusResponse {
  success: boolean;
  status: JobStatus;
  progress: number;
  result?: TryOnResponseDto;
  error?: string;
}

export interface CompletedTryOnJob {
  data: TryOnJobData;
  result: TryOnResponseDto;
}

@Injectable()
export class TryOnQueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.TRY_ON_PROCESSING)
    private readonly tryOnQueue: Queue<TryOnJobData>,
  ) {}

  async addDirectTryOnJob(data: DirectTryOnJobData): Promise<Job<TryOnJobData>> {
    // Keep queue behavior simple and predictable:
    // - attempts=1 avoids duplicate AI generations (cost + inconsistent results)
    // - no Bull hard-timeout; provider-level timeouts handle hangs deterministically
    return this.tryOnQueue.add(JOB_NAMES.PROCESS_DIRECT_TRY_ON, data, {
      attempts: 1,
      removeOnComplete: false,
      removeOnFail: false,
    });
  }

  async hasJobForRequestUser(requestUserId: string): Promise<boolean> {
    const jobs = await this.tryOnQueue.getJobs([
      JOB_STATUS.WAITING,
      JOB_STATUS.ACTIVE,
      JOB_STATUS.COMPLETED,
    ]);
    return jobs.some((job) => job.data.requestUserId === requestUserId);
  }

  async getJobStatus(
    jobId: string,
    requestUserId: string,
  ): Promise<TryOnJobStatusResponse> {
    const job = await this.tryOnQueue.getJob(jobId);

    if (!job || job.data.requestUserId !== requestUserId) {
      return {
        success: false,
        status: JOB_STATUS.NOT_FOUND,
        progress: 0,
      };
    }

    const state = await job.getState();
    const progress = typeof job.progress() === 'number' ? job.progress() : 0;

    return {
      success:
        state === JOB_STATUS.COMPLETED ||
        state === JOB_STATUS.ACTIVE ||
        state === JOB_STATUS.WAITING,
      status: state as JobStatus,
      progress,
      result: job.returnvalue as TryOnResponseDto | undefined,
      error: job.failedReason,
    };
  }

  async getCompletedJobForRequestUser(
    jobId: string,
    requestUserId: string,
  ): Promise<CompletedTryOnJob | null> {
    const job = await this.tryOnQueue.getJob(jobId);
    if (!job || job.data.requestUserId !== requestUserId) {
      return null;
    }

    const state = await job.getState();
    const result = job.returnvalue as TryOnResponseDto | undefined;
    if (state !== JOB_STATUS.COMPLETED || !result?.success) {
      return null;
    }

    return { data: job.data, result };
  }
}
