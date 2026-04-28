import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TryOnStatus } from '../../ai-tryon/enums/ai-provider.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AngleSessionManagerService } from '../services/angle-session-manager.service';
import {
  GenerateAnglesRequestDto,
  ResetAngleSessionDto,
} from '../dto/generate-angles-request.dto';
import {
  AngleJobStatusResponseDto,
  AngleQueuedResponseDto,
  ResetAngleSessionResponseDto,
} from '../dto/generate-angles-response.dto';
import { TryOnPermissionGuard } from '../../auth/guards/tryon-permission.guard';
import { AngleQueueService } from '../../queues/angle-queue.service';

/**
 * Controller for angle generation endpoints
 */
@ApiTags('Angle Generation')
@Controller('angles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AngleGenerationController {
  private readonly logger = new Logger(AngleGenerationController.name);

  constructor(
    private readonly sessionManager: AngleSessionManagerService,
    private readonly angleQueueService: AngleQueueService,
  ) {}

  private createQueuedAngleResponse(
    jobId: string,
    message: string,
  ): AngleQueuedResponseDto {
    return {
      success: true,
      status: TryOnStatus.PENDING,
      jobId,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('generate/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue angle generation job',
    description:
      'Queues an angle generation request and returns immediately with a job ID for polling.',
  })
  @ApiResponse({
    status: 202,
    description: 'Angle generation job queued successfully',
    type: AngleQueuedResponseDto,
  })
  @UseGuards(TryOnPermissionGuard)
  async startGenerateAngle(
    @Body() request: GenerateAnglesRequestDto,
    @Request() req,
  ): Promise<AngleQueuedResponseDto> {
    const job = await this.angleQueueService.addAngleGenerationJob({
      type: 'angle-generation',
      requestUserId: req.user.user_id,
      request,
    });

    return this.createQueuedAngleResponse(
      job.id.toString(),
      'Angle generation job queued successfully',
    );
  }

  @Get('job/:jobId')
  @ApiOperation({
    summary: 'Get angle generation job status',
    description:
      'Returns the status of an async angle generation job and includes the final result when completed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
    type: AngleJobStatusResponseDto,
  })
  async getAngleJobStatus(
    @Param('jobId') jobId: string,
    @Request() req,
  ): Promise<AngleJobStatusResponseDto> {
    return this.angleQueueService.getJobStatus(jobId, req.user.user_id);
  }

  /**
   * Reset angle session for a user+product combination
   */
  @Post('reset-session')
  @ApiOperation({
    summary: 'Reset angle generation session',
    description:
      'Reset the angle generation sequence for a specific user+product combination. ' +
      'This will start the sequence from the beginning (back view) on the next generation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Session reset successfully',
    type: ResetAngleSessionResponseDto,
  })
  async resetSession(
    @Body() request: ResetAngleSessionDto,
  ): Promise<ResetAngleSessionResponseDto> {
    this.logger.log(
      `🔄 Resetting angle session for user ${request.userId}, product ${request.productId}`,
    );

    this.sessionManager.resetSession(request.userId, request.productId);

    return {
      success: true,
      message: 'Angle session reset successfully',
      sessionKey: `${request.userId}_${request.productId}`,
    };
  }
}
