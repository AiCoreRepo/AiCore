import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import {
  JOB_STATUS,
  JobStatus,
  QUEUE_NAMES,
  JOB_NAMES,
} from '../common/constants/queue.constants';
import { AURA_JOB_TIMEOUT } from '../ai-tryon/constants/tryon.constants';

export interface AuraJobData {
  auraId: string;
  userId: string;
  imageUrl?: string;
  sourceImageData?: string;
  sourceImageMimeType?: string;
  generationSource?: 'creation' | 'recreation';
  attributes: {
    height: number;
    weight: number;
    skinTone: string;
    gender: string;
    bodyShape: string;
    bodySize: string;
    ageRange: string;
    hairStyle: string;
  };
}

export interface AuraJobStatusResponse {
  status: JobStatus;
  progress: number;
  data?: Omit<AuraJobData, 'sourceImageData'>;
  result?: any;
  error?: string;
}

@Injectable()
export class AuraQueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.AURA_GENERATION)
    private readonly auraQueue: Queue<AuraJobData>,
  ) { }

  async addAuraGenerationJob(data: AuraJobData): Promise<Job<AuraJobData>> {
    console.log(`📋 Adding avatar generation job for Aura: ${data.auraId}`);

    return this.auraQueue.add(JOB_NAMES.GENERATE_AVATARS, data, {
      attempts: 3,
      // Hard-kill stalled aura jobs (protect worker slots)
      timeout: AURA_JOB_TIMEOUT,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: false,
      removeOnFail: false,
    });
  }

  async getJobStatus(jobId: string): Promise<AuraJobStatusResponse> {
    const job = await this.auraQueue.getJob(jobId);

    if (!job) {
      return { status: JOB_STATUS.NOT_FOUND, progress: 0 };
    }

    const state = await job.getState();
    const progress = typeof job.progress() === 'number' ? job.progress() : 0;

    const sanitizedData: Omit<AuraJobData, 'sourceImageData'> = {
      ...job.data,
    };
    delete (sanitizedData as Partial<AuraJobData>).sourceImageData;

    return {
      status: state as JobStatus,
      progress,
      data: sanitizedData,
      result: job.returnvalue,
      error: job.failedReason,
    };
  }

  async getJobById(jobId: string): Promise<Job<AuraJobData> | null> {
    return this.auraQueue.getJob(jobId);
  }
}
