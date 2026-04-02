import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import type bull from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { AIProvider } from './enums/ai-provider.enum';
import { DirectGeminiTryOnService } from './services/providers/direct-gemini-tryon.service';
import { DirectVertexTryOnService } from './services/providers/direct-vertex-tryon.service';
import { TryOn3DService } from './services/tryon-3d.service';
import { TryOnJobData } from './tryon-queue.service';
import { JOB_NAMES, QUEUE_NAMES } from '../common/constants/queue.constants';

@Injectable()
@Processor(QUEUE_NAMES.TRY_ON_PROCESSING)
export class TryOnProcessor {
  private readonly logger = new Logger(TryOnProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly directGeminiService: DirectGeminiTryOnService,
    private readonly directVertexService: DirectVertexTryOnService,
    private readonly tryOn3DService: TryOn3DService,
  ) {}

  @Process(JOB_NAMES.PROCESS_DIRECT_TRY_ON)
  async handleDirectTryOn(job: bull.Job<TryOnJobData>) {
    const data = job.data;
    await job.progress(10);

    if (data.type !== 'direct') {
      throw new Error('Invalid direct try-on job payload');
    }

    this.logger.log(
      `Starting queued direct try-on for user ${data.requestUserId} with ${data.provider}`,
    );

    const service =
      data.provider === AIProvider.GEMINI_AI
        ? this.directGeminiService
        : this.directVertexService;

    const result = await service.processTryOn(
      data.avatarImage,
      data.clothingImage,
      data.additionalParams,
    );

    await job.progress(100);
    return result;
  }

  @Process(JOB_NAMES.PROCESS_3D_TRY_ON)
  async handleThreeDTryOn(job: bull.Job<TryOnJobData>) {
    const data = job.data;
    await job.progress(10);

    if (data.type !== 'three-d') {
      throw new Error('Invalid 3D try-on job payload');
    }

    this.logger.log(
      `Starting queued 3D try-on for user ${data.requestUserId} and aura ${data.auraId}`,
    );

    const aura = await this.prisma.aura.findUnique({
      where: { aura_id: data.auraId },
    });

    if (!aura) {
      throw new Error('Aura not found for queued try-on job');
    }

    await job.progress(20);

    const result = await this.tryOn3DService.tryOnWithVertex(
      aura,
      data.clothingItemId,
      data.additionalParams,
    );

    await job.progress(100);
    return result;
  }
}
