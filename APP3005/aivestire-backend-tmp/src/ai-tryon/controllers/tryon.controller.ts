import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TryOnPermissionGuard } from '../../auth/guards/tryon-permission.guard';
import { DirectGeminiTryOnService } from '../services/providers/direct-gemini-tryon.service';
import { DirectVertexTryOnService } from '../services/providers/direct-vertex-tryon.service';
import { AIProvider, TryOnStatus } from '../enums/ai-provider.enum';
import { TryOnRequestDto } from '../dto/tryon-request.dto';
import {
  HealthCheckResponseDto,
  TryOnResponseDto,
  TryOnJobStatusResponseDto,
  TryOnQueuedResponseDto,
  TryOnErrorResponseDto,
} from '../dto/tryon-response.dto';
import { TryOnQueueService } from '../../queues/tryon-queue.service';
import {
  TryOnHistoryItem,
  TryOnHistoryService,
} from '../services/tryon-history.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GuestTryOnClaimService } from '../services/guest-tryon-claim.service';
import {
  getPulkitStaticTryOnUrl,
  getPulkitStaticTryOnUrlForSlug,
  isPulkitDemoEmail,
  PULKIT_DEMO_PRODUCT_SLUGS,
} from '../../demo/pulkit-demo.constants';

@ApiTags('AI Try-On')
@Controller('v1/tryon')
export class TryOnController {
  constructor(
    private readonly directGeminiService: DirectGeminiTryOnService,
    private readonly directVertexService: DirectVertexTryOnService,
    private readonly tryOnQueueService: TryOnQueueService,
    private readonly tryOnHistoryService: TryOnHistoryService,
    private readonly prisma: PrismaService,
    private readonly guestTryOnClaimService: GuestTryOnClaimService,
  ) {}

  @Get('guest/static-looks')
  @ApiOperation({ summary: 'Get the pre-generated guest try-on collection' })
  async getGuestStaticLooks(@Query('gender') gender = 'female') {
    const normalizedGender = gender.toLowerCase() === 'male' ? 'male' : 'female';
    const products = await this.prisma.product.findMany({
      where: {
        is_deleted: false,
        AND: [
          { metadata: { path: ['guest_tryon_demo'], equals: true } },
          {
            metadata: {
              path: ['guest_tryon_gender'],
              equals: normalizedGender,
            },
          },
        ],
      },
      include: {
        images: { orderBy: { order_index: 'asc' }, take: 1 },
      },
      orderBy: { created_at: 'asc' },
      take: 3,
    });

    const looks = products
      .map((product) => {
        const metadata =
          product.metadata && typeof product.metadata === 'object'
            ? (product.metadata as Record<string, unknown>)
            : {};
        return {
          id: String(metadata.demo_look_id || product.product_id),
          productId: product.product_id,
          title: product.title,
          subtitle: product.description || '',
          price: new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: product.currency,
            maximumFractionDigits: 0,
          }).format(product.price_cents / 100),
          collectionImage: product.images[0]?.url || '',
          staticResultImage: String(metadata.static_tryon_url || ''),
          modelImage: String(metadata.static_model_url || ''),
        };
      })
      .filter(
        (look) =>
          look.collectionImage && look.staticResultImage && look.modelImage,
      );

    return {
      gender: normalizedGender,
      modelImage: looks[0]?.modelImage || '',
      looks,
    };
  }

  private createQueuedTryOnResponse(
    jobId: string,
    message: string,
  ): TryOnQueuedResponseDto {
    return {
      success: true,
      status: TryOnStatus.PENDING,
      jobId,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  private mapStoredProviderToApiProvider(
    provider: string,
    fallbackProvider: AIProvider,
  ): AIProvider {
    if (provider === 'vertex') {
      return AIProvider.VERTEX_AI;
    }

    if (provider === 'gemini') {
      return AIProvider.GEMINI_AI;
    }

    return fallbackProvider;
  }

  private createReusedTryOnResponse(
    existingTryOn: TryOnHistoryItem,
    requestedProvider: AIProvider,
  ): TryOnResponseDto {
    return {
      success: true,
      status: TryOnStatus.SUCCESS,
      provider: this.mapStoredProviderToApiProvider(
        existingTryOn.provider,
        requestedProvider,
      ),
      resultImage: existingTryOn.resultImageUrl,
      processingTimeMs: 0,
      metadata: {
        reusedFromDb: true,
        reusedTryOnId: existingTryOn.tryOnId,
        reusedAuraId: existingTryOn.auraId,
        reusedSelectedAvatarId: existingTryOn.selectedAvatarId,
        requestedProvider,
      },
      tryOnId: existingTryOn.tryOnId,
      timestamp: existingTryOn.createdAt,
    };
  }

  private async getReusableTryOn(
    userId: string,
    request: TryOnRequestDto,
  ): Promise<TryOnHistoryItem | null> {
    if (request.additionalParams?.forceRegenerate === true) {
      return null;
    }

    if (!request.productId || !request.auraId) {
      return null;
    }

    return this.tryOnHistoryService.findReusableBaseTryOnForCurrentAvatar(
      userId,
      request.productId,
      request.auraId,
    );
  }

  private async getPulkitDemoTryOn(
    email: string | undefined,
    request: TryOnRequestDto,
    provider: AIProvider,
  ): Promise<TryOnResponseDto | null> {
    if (!isPulkitDemoEmail(email) || !request.productId) {
      return null;
    }

    const product = await this.prisma.product.findFirst({
      where: {
        product_id: request.productId,
        slug: { in: [...PULKIT_DEMO_PRODUCT_SLUGS] },
        is_deleted: false,
      },
      select: { slug: true, metadata: true },
    });
    const resultImage =
      getPulkitStaticTryOnUrlForSlug(product?.slug) ||
      getPulkitStaticTryOnUrl(product?.metadata);
    if (!resultImage) {
      return null;
    }

    return {
      success: true,
      status: TryOnStatus.SUCCESS,
      provider,
      resultImage,
      processingTimeMs: 0,
      metadata: {
        staticDemo: true,
        runtimeAiCalled: false,
        requestedProvider: provider,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private getGuestUserId(guestSession?: string): string {
    const normalized = guestSession?.trim();
    if (!normalized || !/^[a-zA-Z0-9_-]{16,80}$/.test(normalized)) {
      throw new BadRequestException('A valid guest session is required');
    }
    return `guest:${normalized}`;
  }

  @Post('guest/gemini/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue one anonymous guest try-on' })
  async startGuestTryOn(
    @Body() request: TryOnRequestDto,
    @Headers('x-guest-session') guestSession?: string,
  ): Promise<TryOnQueuedResponseDto> {
    const guestUserId = this.getGuestUserId(guestSession);
    if (await this.tryOnQueueService.hasJobForRequestUser(guestUserId)) {
      throw new BadRequestException(
        'Your free guest try-on is already used. Sign in to try more.',
      );
    }
    const job = await this.tryOnQueueService.addDirectTryOnJob({
      type: 'direct',
      provider: AIProvider.GEMINI_AI,
      requestUserId: guestUserId,
      avatarImage: request.avatarImage,
      clothingImage: request.clothingImage,
      additionalParams: {
        ...(request.additionalParams || {}),
        maskClothingModel: true,
        forceRegenerate: true,
        guestTryOn: true,
      },
      guestAvatarFirst: true,
    });

    return this.createQueuedTryOnResponse(
      job.id.toString(),
      'Guest try-on job queued successfully',
    );
  }

  @Get('guest/job/:jobId')
  @ApiOperation({ summary: 'Get anonymous guest try-on status' })
  async getGuestTryOnJobStatus(
    @Param('jobId') jobId: string,
    @Headers('x-guest-session') guestSession?: string,
  ): Promise<TryOnJobStatusResponseDto> {
    return this.tryOnQueueService.getJobStatus(
      jobId,
      this.getGuestUserId(guestSession),
    );
  }

  @Post('guest/claim')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Claim a completed guest Aura and try-on after authentication',
  })
  async claimGuestTryOn(
    @Body() body: { jobId?: string },
    @Headers('x-guest-session') guestSession: string | undefined,
    @Request() req,
  ) {
    const jobId = body.jobId?.trim();
    if (!jobId || !/^[a-zA-Z0-9:_-]{1,100}$/.test(jobId)) {
      throw new BadRequestException('A valid guest try-on job is required');
    }

    return this.guestTryOnClaimService.claim(
      req.user.user_id,
      this.getGuestUserId(guestSession),
      jobId,
    );
  }

  /**
   * Queue Vertex AI try-on job for async processing.
   */
  @Post('vertex/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue Vertex AI try-on job',
    description:
      'Queues a Vertex AI try-on request and returns immediately with a job ID for polling.',
  })
  @ApiResponse({
    status: 202,
    description: 'Try-on job queued successfully',
    type: TryOnQueuedResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
    type: TryOnErrorResponseDto,
  })
  @UseGuards(JwtAuthGuard, TryOnPermissionGuard)
  async startTryOnWithVertex(
    @Body() request: TryOnRequestDto,
    @Request() req,
  ): Promise<TryOnQueuedResponseDto | TryOnResponseDto> {
    const staticDemo = await this.getPulkitDemoTryOn(
      req.user.email,
      request,
      AIProvider.VERTEX_AI,
    );
    if (staticDemo) {
      return staticDemo;
    }

    const reusableTryOn = await this.getReusableTryOn(
      req.user.user_id,
      request,
    );

    if (reusableTryOn) {
      return this.createReusedTryOnResponse(
        reusableTryOn,
        AIProvider.VERTEX_AI,
      );
    }

    const job = await this.tryOnQueueService.addDirectTryOnJob({
      type: 'direct',
      provider: AIProvider.VERTEX_AI,
      requestUserId: req.user.user_id,
      avatarImage: request.avatarImage,
      clothingImage: request.clothingImage,
      additionalParams: request.additionalParams,
      productId: request.productId,
      auraId: request.auraId,
    });

    return this.createQueuedTryOnResponse(
      job.id.toString(),
      'Vertex try-on job queued successfully',
    );
  }

  /**
   * Queue Gemini AI try-on job for async processing.
   */
  @Post('gemini/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue Gemini AI try-on job',
    description:
      'Queues a Gemini AI try-on request and returns immediately with a job ID for polling.',
  })
  @ApiResponse({
    status: 202,
    description: 'Try-on job queued successfully',
    type: TryOnQueuedResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
    type: TryOnErrorResponseDto,
  })
  @UseGuards(JwtAuthGuard, TryOnPermissionGuard)
  async startTryOnWithGemini(
    @Body() request: TryOnRequestDto,
    @Request() req,
  ): Promise<TryOnQueuedResponseDto | TryOnResponseDto> {
    const staticDemo = await this.getPulkitDemoTryOn(
      req.user.email,
      request,
      AIProvider.GEMINI_AI,
    );
    if (staticDemo) {
      return staticDemo;
    }

    const reusableTryOn = await this.getReusableTryOn(
      req.user.user_id,
      request,
    );

    if (reusableTryOn) {
      return this.createReusedTryOnResponse(
        reusableTryOn,
        AIProvider.GEMINI_AI,
      );
    }

    const job = await this.tryOnQueueService.addDirectTryOnJob({
      type: 'direct',
      provider: AIProvider.GEMINI_AI,
      requestUserId: req.user.user_id,
      avatarImage: request.avatarImage,
      clothingImage: request.clothingImage,
      additionalParams: request.additionalParams,
      productId: request.productId,
      auraId: request.auraId,
    });

    return this.createQueuedTryOnResponse(
      job.id.toString(),
      'Gemini try-on job queued successfully',
    );
  }

  /**
   * Return async try-on job status.
   */
  @Get('job/:jobId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get try-on job status',
    description:
      'Returns the status of an async try-on job and includes the final result when completed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
    type: TryOnJobStatusResponseDto,
  })
  async getTryOnJobStatus(
    @Param('jobId') jobId: string,
    @Request() req,
  ): Promise<TryOnJobStatusResponseDto> {
    return this.tryOnQueueService.getJobStatus(jobId, req.user.user_id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get user try-on history',
    description: 'Fetch saved try-ons for the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Try-on history retrieved successfully',
  })
  async getTryOnHistory(@Request() req) {
    const userId: string = req.user.user_id;
    const history = await this.tryOnHistoryService.getTryOnHistory(userId);
    return { userId, ...history };
  }




  /**
   * Health check endpoint.
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check for AI services',
    description:
      'Check the availability and configuration status of Vertex AI and Gemini AI services.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    type: HealthCheckResponseDto,
  })
  async healthCheck(): Promise<HealthCheckResponseDto> {
    const geminiStatus = this.directGeminiService.getConfigurationStatus();
    const vertexStatus = this.directVertexService.getConfigurationStatus();

    const geminiAvailable = await this.directGeminiService.isAvailable();
    const vertexAvailable = await this.directVertexService.isAvailable();

    return {
      healthy: geminiAvailable || vertexAvailable,
      geminiAI: {
        available: geminiAvailable,
        configured: geminiStatus.configured,
        message: geminiStatus.message,
      },
      vertexAI: {
        available: vertexAvailable,
        configured: vertexStatus.configured,
        message: vertexStatus.message,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
