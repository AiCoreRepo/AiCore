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
  Query,
  Logger,
  UseGuards,
  Request,
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
} from '../dto/tryon-response.dto';
import {
  AnalyzeBodyDto,
  BodyAnalysisResultDto,
} from '../dto/body-analyzer.dto';
import { AIProvider } from '../enums/ai-provider.enum';
import { DirectVertexTryOnService } from '../services/providers/direct-vertex-tryon.service';
// import { GeminiTryOnService } from '../services/providers/gemini-tryon.service';
import { BodyAnalyzerService } from '../services/body-analyzer.service';
import { TryOn3DService } from '../services/tryon-3d.service';
import { AuraGuard } from '../../common/guards/aura.guard';
import { CurrentAura } from '../../common/decorators/aura.decorator';
import type { Aura } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TryOnPermissionGuard } from '../../auth/guards/tryon-permission.guard';

@ApiTags('AI Try-On')
@Controller('v1/tryon')
export class TryOnController {
  private readonly logger = new Logger(TryOnController.name);

  constructor(
    // private readonly geminiService: GeminiTryOnService,
    private readonly directVertexService: DirectVertexTryOnService,
    private readonly bodyAnalyzerService: BodyAnalyzerService,
    private readonly tryOn3DService: TryOn3DService,
  ) {}

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
   * @deprecated Try on is done only by vertex
   */
  /*
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
    @UseGuards(JwtAuthGuard, TryOnPermissionGuard)
    async tryOnWithGemini(
        @Body() request: TryOnRequestDto,
    ): Promise<TryOnResponseDto> {
        this.logger.log('Processing try-on request with Gemini AI');
        return this.geminiService.processTryOn(
            request.avatarImage,
            request.clothingImage,
            request.additionalParams,
        );
    }
    */

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
    const avatarBase64 = `data:${files.avatarImage[0].mimetype};base64,${files.avatarImage[0].buffer.toString('base64')}`;
    const clothingBase64 = `data:${files.clothingImage[0].mimetype};base64,${files.clothingImage[0].buffer.toString('base64')}`;

    // Select service based on provider
    // const provider = body.provider || AIProvider.GEMINI_AI;
    // const service =
    //     provider === AIProvider.VERTEX_AI
    //         ? this.directVertexService
    //         : this.geminiService;

    // Force to use Direct Vertex
    const service = this.directVertexService;

    return service.processTryOn(
      avatarBase64,
      clothingBase64,
      body.additionalParams,
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
  @UseGuards(AuraGuard, TryOnPermissionGuard)
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
    // const geminiStatus = this.geminiService.getConfigurationStatus();
    const vertexStatus = this.directVertexService.getConfigurationStatus();

    // const geminiAvailable = await this.geminiService.isAvailable();
    const geminiAvailable = false;
    const vertexAvailable = await this.directVertexService.isAvailable();

    return {
      healthy: geminiAvailable || vertexAvailable,
      geminiAI: {
        available: geminiAvailable,
        configured: false, // geminiStatus.configured,
        message: 'Gemini try-on disabled. Using Vertex.', // geminiStatus.message,
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
}
