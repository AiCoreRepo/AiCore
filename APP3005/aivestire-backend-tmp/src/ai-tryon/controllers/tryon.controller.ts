import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
  Request,
  Param,
  Res,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import {
  TryOnRequestDto,
  TryOnFileUploadDto,
  TryOn3DRequestDto,
  GenerateAnglesRequestDto,
} from '../dto/tryon-request.dto';
import {
  TryOnResponseDto,
  TryOnErrorResponseDto,
  HealthCheckResponseDto,
  TryOnQueuedResponseDto,
  TryOnJobStatusResponseDto,
} from '../dto/tryon-response.dto';
import {
  AnalyzeBodyDto,
  BodyAnalysisResultDto,
} from '../dto/body-analyzer.dto';
import { AIProvider, TryOnStatus } from '../enums/ai-provider.enum';
import { DirectVertexTryOnService } from '../services/providers/direct-vertex-tryon.service';
import { DirectGeminiTryOnService } from '../services/providers/direct-gemini-tryon.service';
import { BodyAnalyzerService } from '../services/body-analyzer.service';
import { TryOn3DService } from '../services/tryon-3d.service';
import { AuraGuard } from '../../common/guards/aura.guard';
import { CurrentAura } from '../../common/decorators/aura.decorator';
import type { Aura } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TryOnPermissionGuard } from '../../auth/guards/tryon-permission.guard';
import _ from 'lodash';
import { TryOnQueueService } from '../tryon-queue.service';
import type { Response } from 'express';
import { TryOnException } from '../exceptions/tryon.exceptions';

@ApiTags('AI Try-On')
@Controller('v1/tryon')
export class TryOnController {
  private readonly logger = new Logger(TryOnController.name);
  private static readonly STREAM_HEARTBEAT_INTERVAL_MS = 15000;

  constructor(
    private readonly directGeminiService: DirectGeminiTryOnService,
    private readonly directVertexService: DirectVertexTryOnService,
    private readonly bodyAnalyzerService: BodyAnalyzerService,
    private readonly tryOn3DService: TryOn3DService,
    private readonly tryOnQueueService: TryOnQueueService,
  ) {}

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

  /**
   * Queue Vertex AI try-on job for async processing
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
  @UseGuards(JwtAuthGuard, TryOnPermissionGuard)
  async startTryOnWithVertex(
    @Body() request: TryOnRequestDto,
    @Request() req,
  ): Promise<TryOnQueuedResponseDto> {
    const job = await this.tryOnQueueService.addDirectTryOnJob({
      type: 'direct',
      provider: AIProvider.VERTEX_AI,
      requestUserId: req.user.user_id,
      avatarImage: request.avatarImage,
      clothingImage: request.clothingImage,
      additionalParams: request.additionalParams,
    });

    return this.createQueuedTryOnResponse(
      job.id.toString(),
      'Vertex try-on job queued successfully',
    );
  }

  /**
   * Queue Gemini AI try-on job for async processing
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
  @UseGuards(JwtAuthGuard)
  async startTryOnWithGemini(
    @Body() request: TryOnRequestDto,
    @Request() req,
  ): Promise<TryOnQueuedResponseDto> {
    const job = await this.tryOnQueueService.addDirectTryOnJob({
      type: 'direct',
      provider: AIProvider.GEMINI_AI,
      requestUserId: req.user.user_id,
      avatarImage: request.avatarImage,
      clothingImage: request.clothingImage,
      additionalParams: request.additionalParams,
    });

    return this.createQueuedTryOnResponse(
      job.id.toString(),
      'Gemini try-on job queued successfully',
    );
  }

  /**
   * Stream Gemini AI try-on response with keepalive chunks
   */
  @Post('gemini/stream')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Stream Gemini AI try-on response',
    description:
      'Streams Gemini try-on progress and final result using server-sent events over a POST request.',
  })
  @ApiResponse({
    status: 200,
    description: 'Streamed try-on response',
  })
  async streamTryOnWithGemini(
    @Body() request: TryOnRequestDto,
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    const startedAt = Date.now();
    let clientClosed = false;

    this.prepareStreamResponse(res);

    const heartbeat = setInterval(() => {
      this.writeStreamEvent(res, 'keepalive', {
        timestamp: new Date().toISOString(),
      });
    }, TryOnController.STREAM_HEARTBEAT_INTERVAL_MS);

    res.on('close', () => {
      clientClosed = true;
      clearInterval(heartbeat);
    });

    try {
      const result = await this.directGeminiService.processTryOnStream(
        request.avatarImage,
        request.clothingImage,
        request.additionalParams,
        async (event) => {
          if (clientClosed) {
            return;
          }

          if (event.type === 'status') {
            this.writeStreamEvent(res, 'status', event);
            return;
          }

          if (event.type === 'preview') {
            this.writeStreamEvent(res, 'preview', event);
            return;
          }

          this.writeStreamEvent(res, 'chunk', event);
        },
      );
      const persistedResult = await this.attachTryOnHistoryId(
        req.user.user_id,
        request.additionalParams,
        result,
        'gemini',
      );

      if (!clientClosed) {
        this.writeStreamEvent(res, 'result', persistedResult);
      }
    } catch (error) {
      this.logger.error(
        `Gemini streaming try-on failed after ${Date.now() - startedAt}ms: ${error instanceof Error ? error.message : 'unknown error'}`,
      );

      if (!clientClosed) {
        this.writeStreamEvent(res, 'error', this.buildStreamErrorPayload(error));
      }
    } finally {
      clearInterval(heartbeat);
      if (!clientClosed && !res.writableEnded) {
        this.writeStreamEvent(res, 'done', {
          timestamp: new Date().toISOString(),
        });
        res.end();
      }
    }
  }

  /**
   * Return async try-on job status
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

  /**
   * Virtual try-on using Vertex AI
   */
  @Post('vertex')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Virtual try-on using Vertex AI',
    description:
      'Process virtual try-on using Google Vertex AI Imagen. Accepts avatar and clothing images as base64 or URLs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Try-on completed successfully',
    type: TryOnResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or image validation failed',
    type: TryOnErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: TryOnErrorResponseDto,
  })
  @UseGuards(JwtAuthGuard, TryOnPermissionGuard)
  async tryOnWithVertex(
    @Body() request: TryOnRequestDto,
  ): Promise<TryOnResponseDto> {
    this.logger.log('Processing try-on request with Vertex AI (direct)');
    return this.directVertexService.processTryOn(
      request.avatarImage,
      request.clothingImage,
      request.additionalParams,
    );
  }

  /**
   * Virtual try-on using Gemini AI
   */
  @Post('gemini')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Virtual try-on using Gemini AI',
    description:
      'Process virtual try-on using Google Gemini AI. Accepts avatar and clothing images as base64 or URLs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Try-on completed successfully',
    type: TryOnResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or image validation failed',
    type: TryOnErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: TryOnErrorResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  async tryOnWithGemini(
    @Body() request: TryOnRequestDto,
    @Request() req,
  ): Promise<TryOnResponseDto> {
    this.logger.log('Processing try-on request with Gemini AI (direct)');
    const result = await this.directGeminiService.processTryOn(
      request.avatarImage,
      request.clothingImage,
      request.additionalParams,
    );
    return this.attachTryOnHistoryId(
      req.user.user_id,
      request.additionalParams,
      result,
      'gemini',
    );
  }

  /**
   * Auto-select best available provider
   * @deprecated Try on is done only by vertex
   */
  /*
    @Post('auto')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Virtual try-on with auto provider selection',
        description:
            'Automatically selects the best available AI provider (Gemini or Vertex) for virtual try-on.',
    })
    @ApiResponse({
        status: 200,
        description: 'Try-on completed successfully',
        type: TryOnResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid request or image validation failed',
        type: TryOnErrorResponseDto,
    })
    @ApiResponse({
        status: 503,
        description: 'No AI providers available',
        type: TryOnErrorResponseDto,
    })
    @UseGuards(JwtAuthGuard, TryOnPermissionGuard)
    async tryOnAuto(
        @Body() request: TryOnRequestDto,
    ): Promise<TryOnResponseDto> {
        this.logger.log('Processing try-on request with auto provider selection');

        // Check which providers are available
        const geminiAvailable = await this.geminiService.isAvailable();
        const vertexAvailable = await this.directVertexService.isAvailable();

        // Prefer Gemini if both are available (faster and cheaper)
        if (geminiAvailable) {
            this.logger.log('Using Gemini AI (auto-selected)');
            return this.geminiService.processTryOn(
                request.avatarImage,
                request.clothingImage,
                request.additionalParams,
            );
        } else if (vertexAvailable) {
            this.logger.log('Using Vertex AI (auto-selected)');
            return this.directVertexService.processTryOn(
                request.avatarImage,
                request.clothingImage,
                request.additionalParams,
            );
        } else {
            throw new Error(
                'No AI providers are currently available. Please configure GEMINI_API_KEY or VERTEX_AI credentials.',
            );
        }
    }
    */

  /**
   * Virtual try-on with file upload
   */
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatarImage', maxCount: 1 },
      { name: 'clothingImage', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Virtual try-on with file upload',
    description:
      'Upload avatar and clothing images as files for virtual try-on processing.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatarImage: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file',
        },
        clothingImage: {
          type: 'string',
          format: 'binary',
          description: 'Clothing image file',
        },
        provider: {
          type: 'string',
          enum: ['VERTEX_AI', 'GEMINI_AI'],
          description: 'AI provider to use (optional)',
        },
      },
      required: ['avatarImage', 'clothingImage'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Try-on completed successfully',
    type: TryOnResponseDto,
  })
  @UseGuards(JwtAuthGuard, TryOnPermissionGuard)
  async tryOnWithUpload(
    @UploadedFiles()
    files: {
      avatarImage?: Express.Multer.File[];
      clothingImage?: Express.Multer.File[];
    },
    @Body() body: TryOnFileUploadDto,
  ): Promise<TryOnResponseDto> {
    this.logger.log('Processing try-on request with file upload');

    if (!files.avatarImage || !files.clothingImage) {
      throw new Error('Both avatarImage and clothingImage files are required');
    }

    // Convert files to base64
    const avatarFile = _.head(files.avatarImage);
    const clothingFile = _.head(files.clothingImage);

    if (!avatarFile || !clothingFile) {
      throw new Error('Both avatarImage and clothingImage files are required');
    }

    const avatarBase64 = `data:${avatarFile.mimetype};base64,${avatarFile.buffer.toString('base64')}`;
    const clothingBase64 = `data:${clothingFile.mimetype};base64,${clothingFile.buffer.toString('base64')}`;

    // Select service based on provider
    const provider = body.provider ?? AIProvider.VERTEX_AI;
    const service =
      provider === AIProvider.GEMINI_AI
        ? this.directGeminiService
        : this.directVertexService;

    return service.processTryOn(
      avatarBase64,
      clothingBase64,
      body.additionalParams,
    );
  }

  /**
   * Queue 3D Virtual try-on with Vertex AI
   */
  @Post('3d/vertex/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue 3D Try-on with Vertex AI',
    description:
      'Queues a 3D Vertex AI try-on request and returns immediately with a job ID for polling.',
  })
  @ApiResponse({
    status: 202,
    description: '3D try-on job queued successfully',
    type: TryOnQueuedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User does not have Aura avatar',
    type: TryOnErrorResponseDto,
  })
  @UseGuards(JwtAuthGuard, AuraGuard, TryOnPermissionGuard)
  async startTryOn3DWithVertex(
    @Body() request: TryOn3DRequestDto,
    @CurrentAura() aura: Aura,
    @Request() req,
  ): Promise<TryOnQueuedResponseDto> {
    const job = await this.tryOnQueueService.addThreeDTryOnJob({
      type: 'three-d',
      provider: AIProvider.VERTEX_AI,
      requestUserId: req.user.user_id,
      auraId: aura.aura_id,
      clothingItemId: request.clothingItemId,
      additionalParams: request.additionalParams,
    });

    return this.createQueuedTryOnResponse(
      job.id.toString(),
      '3D Vertex try-on job queued successfully',
    );
  }

  /**
   * 3D Virtual try-on with Vertex AI (Step 1 - No Background)
   */
  @Post('3d/vertex')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '3D Try-on with Vertex AI (no background)',
    description:
      'Process 3D virtual try-on using Vertex AI. Requires user to have Aura avatar. Returns try-on without background.',
  })
  @ApiResponse({
    status: 200,
    description: 'Try-on completed successfully',
    type: TryOnResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User does not have Aura avatar',
    type: TryOnErrorResponseDto,
  })
  @UseGuards(JwtAuthGuard, AuraGuard, TryOnPermissionGuard)
  async tryOn3DWithVertex(
    @Body() request: TryOn3DRequestDto,
    @CurrentAura() aura: Aura,
  ): Promise<TryOnResponseDto> {
    this.logger.log(
      `Processing 3D try-on with Vertex for user ${request.userId}`,
    );
    return this.tryOn3DService.tryOnWithVertex(
      aura,
      request.clothingItemId,
      request.additionalParams,
    );
  }

  /**
   * 3D Virtual try-on with Gemini AI (Full Flow with Background)
   * @deprecated Try on is done only by vertex
   */
  /*
    @Post('3d/gemini')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard, AuraGuard, TryOnPermissionGuard)
    @ApiOperation({
        summary: '3D Try-on with Gemini AI (with background)',
        description:
            'Process 3D virtual try-on using Gemini AI. Requires user to have Aura avatar. Returns try-on with background.',
    })
    @ApiResponse({
        status: 200,
        description: 'Try-on completed successfully',
        type: TryOnResponseDto,
    })
    @ApiResponse({
        status: 403,
        description: 'User does not have Aura avatar',
        type: TryOnErrorResponseDto,
    })
    async tryOn3DWithGemini(
        @Body() request: TryOn3DRequestDto,
        @CurrentAura() aura: Aura,
    ): Promise<TryOnResponseDto> {
        this.logger.log(`Processing 3D try-on with Gemini for user ${request.userId}`);
        return this.tryOn3DService.tryOnWithGemini(
            aura,
            request.clothingItemId,
            request.additionalParams,
        );
    }
    */

  /**
   * Generate more angles from existing try-on image
   * @deprecated handled in DifferentAnglesGenModule
   */
  /*
    @Post('3d/more-angles')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard, AuraGuard, TryOnPermissionGuard)
    @ApiOperation({
        summary: 'Generate more angles from existing try-on',
        description:
            'Generate additional camera angles and backgrounds from an existing try-on image using Gemini AI.',
    })
    @ApiResponse({
        status: 200,
        description: 'New angle generated successfully',
        type: TryOnResponseDto,
    })
    @ApiResponse({
        status: 403,
        description: 'User does not have Aura avatar',
        type: TryOnErrorResponseDto,
    })
    async generateMoreAngles(
        @Body() request: GenerateAnglesRequestDto,
        @CurrentAura() aura: Aura,
    ): Promise<TryOnResponseDto> {
        this.logger.log(`Generating more angles for user ${request.userId}, product ${request.productId}`);
        return this.tryOn3DService.generateMoreAngles(
            aura,
            request.productId,
            request.previousImageUrl,
            request.additionalParams,
        );
    }
    */

  /**
   * Get user's try-on history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get user try-on history',
    description:
      'Fetch all try-on images for the current user with product details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Try-on history retrieved successfully',
  })
  async getTryOnHistory(@Request() req): Promise<any> {
    const userId = req.user.user_id; // Changed from userId to user_id
    this.logger.log(`🔐 JWT User Data: ${JSON.stringify(req.user)}`);
    this.logger.log(`🔐 Extracted userId: ${userId}`);
    this.logger.log(`📸 Fetching try-on history for user ${userId}`);
    return this.tryOn3DService.getTryOnHistory(userId);
  }

  private prepareStreamResponse(res: Response): void {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
  }

  private writeStreamEvent(
    res: Response,
    eventName: string,
    payload: object,
  ): void {
    if (res.writableEnded) {
      return;
    }

    const json = JSON.stringify(payload);
    const lines = json.split(/\r?\n/);
    res.write(`event: ${eventName}\n`);
    for (const line of lines) {
      res.write(`data: ${line}\n`);
    }
    res.write('\n');

    const flush = (res as Response & { flush?: () => void }).flush;
    if (typeof flush === 'function') {
      flush.call(res);
    }
  }

  private buildStreamErrorPayload(error: unknown): Record<string, unknown> {
    const timestamp = new Date().toISOString();

    if (error instanceof TryOnException) {
      const response = error.getResponse();
      const payload =
        typeof response === 'object' && response !== null
          ? (response as Record<string, unknown>)
          : {};

      return {
        message:
          typeof payload.message === 'string'
            ? payload.message
            : error.message || 'Gemini try-on failed',
        errorCode: error.errorCode,
        statusCode: error.getStatus(),
        details: payload.details ?? error.details,
        timestamp,
      };
    }

    return {
      message: error instanceof Error ? error.message : 'Gemini try-on failed',
      timestamp,
    };
  }

  /**
   * Health check endpoint
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

  /**
   * Analyze body attributes from image (JSON base64)
   */
  @Post('analyze-body')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Analyze body attributes from image',
    description:
      'Analyze a user image to detect skin tone, body shape, and other attributes. Accepts base64 encoded image.',
  })
  @ApiResponse({
    status: 200,
    description: 'Body analysis completed successfully',
    type: BodyAnalysisResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid image data',
    type: TryOnErrorResponseDto,
  })
  async analyzeBody(
    @Body() request: AnalyzeBodyDto,
  ): Promise<BodyAnalysisResultDto> {
    this.logger.log('Processing body analysis request (JSON base64)');
    return this.bodyAnalyzerService.analyzeImage(request.imageBase64);
  }

  /**
   * Analyze body attributes from image (file upload)
   */
  @Post('analyze-body/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Analyze body attributes from uploaded image',
    description:
      'Upload an image file to analyze skin tone, body shape, and other attributes.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, or WebP)',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Body analysis completed successfully',
    type: BodyAnalysisResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid image file',
    type: TryOnErrorResponseDto,
  })
  async analyzeBodyUpload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BodyAnalysisResultDto> {
    this.logger.log('Processing body analysis request (file upload)');

    if (!file) {
      return {
        success: false,
        skinHexes: [],
        fullBody: false,
        error: 'No image file provided',
      };
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return {
        success: false,
        skinHexes: [],
        fullBody: false,
        error:
          'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      };
    }

    return this.bodyAnalyzerService.analyzeImageBuffer(
      file.buffer,
      file.mimetype,
    );
  }

  private async attachTryOnHistoryId(
    userId: string,
    additionalParams: Record<string, any> | undefined,
    result: TryOnResponseDto,
    provider: string,
  ): Promise<TryOnResponseDto> {
    if (!result?.resultImage) {
      return result;
    }

    const productId = _.get(additionalParams, 'product_id');
    const auraId = _.get(additionalParams, 'aura_id');

    if (!productId || !auraId) {
      return result;
    }

    try {
      const tryOnId = await this.tryOn3DService.saveDirectTryOnResultForHistory(
        {
          userId,
          productId,
          auraId,
          resultImageUrl: result.resultImage,
          provider,
        },
      );

      return tryOnId
        ? {
            ...result,
            tryOnId,
          }
        : result;
    } catch (error) {
      this.logger.warn(
        `Failed to persist direct ${provider} try-on result for history: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return result;
    }
  }
}
