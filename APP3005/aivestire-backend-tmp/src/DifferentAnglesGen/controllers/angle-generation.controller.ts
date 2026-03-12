import { Controller, Post, Body, Logger, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AngleGenerationService } from '../services/angle-generation.service';
import { AngleSessionManagerService } from '../services/angle-session-manager.service';
import {
  GenerateAnglesRequestDto,
  ResetAngleSessionDto,
} from '../dto/generate-angles-request.dto';
import {
  GenerateAnglesResponseDto,
  ResetAngleSessionResponseDto,
} from '../dto/generate-angles-response.dto';
import { TryOnPermissionGuard } from '../../auth/guards/tryon-permission.guard';

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
    private readonly angleGenerationService: AngleGenerationService,
    private readonly sessionManager: AngleSessionManagerService,
  ) {}

  /**
   * Generate next angle in sequence from try-on image
   */
  @Post('generate')
  @ApiOperation({
    summary: 'Generate more angles from try-on image',
    description:
      'Generate additional camera angles from an existing try-on image using Gemini AI. ' +
      'Automatically determines the next angle in sequence or uses explicitly requested angle.',
  })
  @ApiResponse({
    status: 201,
    description: 'Angle generated successfully',
    type: GenerateAnglesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 404,
    description: 'Aura not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Angle generation failed',
  })
  @UseGuards(TryOnPermissionGuard)
  async generateAngle(
    @Body() request: GenerateAnglesRequestDto,
  ): Promise<GenerateAnglesResponseDto> {
    this.logger.log(
      `📐 Angle generation request for product ${request.productId}`,
    );

    return await this.angleGenerationService.generateAngle(request);
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
