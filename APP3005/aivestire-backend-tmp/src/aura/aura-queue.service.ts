import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import { JOB_STATUS, JobStatus, QUEUE_NAMES, JOB_NAMES } from '../common/constants/queue.constants';

export interface AuraJobData {
    auraId: string;
    userId: string;
    imageUrl: string;
    attributes: {
        height: number;
        weight: number;
        skinTone: string;
        gender: string;
        bodyShape: string;
        ageRange: string;
        hairStyle: string;
    };
}

export interface JobStatusResponse {
    status: JobStatus;
    progress: number;
    data?: AuraJobData;
    result?: any;
    error?: string;
}

@Injectable()
export class AuraQueueService {
    constructor(
        @InjectQueue(QUEUE_NAMES.AURA_GENERATION) private auraQueue: Queue<AuraJobData>,
    ) { }

    async addAuraGenerationJob(data: AuraJobData): Promise<Job<AuraJobData>> {
        console.log(`📋 Adding avatar generation job for Aura: ${data.auraId}`);

        return this.auraQueue.add(JOB_NAMES.GENERATE_AVATARS, data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: false, // Keep for status checking
            removeOnFail: false,
        });
    }

    async getJobStatus(jobId: string): Promise<JobStatusResponse> {
        const job = await this.auraQueue.getJob(jobId);

        if (!job) {
            return { status: JOB_STATUS.NOT_FOUND, progress: 0 };
        }

        const state = await job.getState();
        const progress = typeof job.progress() === 'number' ? job.progress() : 0;

        return {
            status: state as JobStatus,
            progress,
            data: job.data,
            result: job.returnvalue,
            error: job.failedReason,
        };
    }

    async getJobById(jobId: string): Promise<Job<AuraJobData> | null> {
        return this.auraQueue.getJob(jobId);
    }
}
