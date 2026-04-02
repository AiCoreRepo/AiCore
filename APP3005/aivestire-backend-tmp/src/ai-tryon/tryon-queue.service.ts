import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { AIProvider } from './enums/ai-provider.enum';
import {
  JOB_NAMES,
  JOB_STATUS,
  JobStatus,
  QUEUE_NAMES,
} from '../common/constants/queue.constants';
import { TryOnResponseDto } from './dto/tryon-response.dto';

export interface DirectTryOnJobData {
  type: 'direct';
  provider: AIProvider;
  requestUserId: string;
  avatarImage: string;
  clothingImage: string;
  additionalParams?: Record<string, any>;
}

export interface ThreeDTryOnJobData {
  type: 'three-d';
  provider: AIProvider.VERTEX_AI;
  requestUserId: string;
  auraId: string;
  clothingItemId: string;
  additionalParams?: Record<string, any>;
}

export type TryOnJobData = DirectTryOnJobData | ThreeDTryOnJobData;

export interface TryOnJobStatusResponse {
  success: boolean;
  status: JobStatus;
  progress: number;
  result?: TryOnResponseDto;
  error?: string;
}

@Injectable()
export class TryOnQueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.TRY_ON_PROCESSING)
    private readonly tryOnQueue: Queue<TryOnJobData>,
  ) {}

  async addDirectTryOnJob(
    data: DirectTryOnJobData,
  ): Promise<Job<TryOnJobData>> {
    return this.tryOnQueue.add(JOB_NAMES.PROCESS_DIRECT_TRY_ON, data, {
      attempts: 1,
      removeOnComplete: false,
      removeOnFail: false,
    });
  }

  async addThreeDTryOnJob(
    data: ThreeDTryOnJobData,
  ): Promise<Job<TryOnJobData>> {
    return this.tryOnQueue.add(JOB_NAMES.PROCESS_3D_TRY_ON, data, {
      attempts: 1,
      removeOnComplete: false,
      removeOnFail: false,
    });
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
}
