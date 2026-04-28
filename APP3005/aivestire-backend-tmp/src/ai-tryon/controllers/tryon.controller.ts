import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
  TryOnJobStatusResponseDto,
  TryOnQueuedResponseDto,
  TryOnErrorResponseDto,
} from '../dto/tryon-response.dto';
import { TryOnQueueService } from '../../queues/tryon-queue.service';
import { TryOnHistoryService } from '../services/tryon-history.service';

@ApiTags('AI Try-On')
@Controller('v1/tryon')
export class TryOnController {
  constructor(
    private readonly directGeminiService: DirectGeminiTryOnService,
    private readonly directVertexService: DirectVertexTryOnService,
    private readonly tryOnQueueService: TryOnQueueService,
    private readonly tryOnHistoryService: TryOnHistoryService,
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
  ): Promise<TryOnQueuedResponseDto> {
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
  ): Promise<TryOnQueuedResponseDto> {
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
