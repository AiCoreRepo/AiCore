import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import {
  JOB_NAMES,
  JOB_STATUS,
  JobStatus,
  QUEUE_NAMES,
} from '../common/constants/queue.constants';
import { GenerateAnglesRequestDto } from '../angles-generation/dto/generate-angles-request.dto';
import { GenerateAnglesResponseDto } from '../angles-generation/dto/generate-angles-response.dto';

export interface AngleGenerationJobData {
  type: 'angle-generation';
  requestUserId: string;
  request: GenerateAnglesRequestDto;
}

export interface AngleGenerationJobStatusResponse {
  success: boolean;
  status: JobStatus;
  progress: number;
  result?: GenerateAnglesResponseDto;
  error?: string;
}

@Injectable()
export class AngleQueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.ANGLES_GENERATION)
    private readonly angleQueue: Queue<AngleGenerationJobData>,
  ) {}

  async addAngleGenerationJob(
    data: AngleGenerationJobData,
  ): Promise<Job<AngleGenerationJobData>> {
    return this.angleQueue.add(JOB_NAMES.PROCESS_ANGLE_GENERATION, data, {
      attempts: 1,
      removeOnComplete: false,
      removeOnFail: false,
    });
  }

  async getJobStatus(
    jobId: string,
    requestUserId: string,
  ): Promise<AngleGenerationJobStatusResponse> {
    const job = await this.angleQueue.getJob(jobId);

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
      result: job.returnvalue as GenerateAnglesResponseDto | undefined,
      error: job.failedReason,
    };
  }
}