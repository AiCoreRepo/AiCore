import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BodyAnalyzerService } from './body-analyzer.service';
import { AnalyzeBodyDto, BodyAnalysisResultDto } from './dto/body-analyzer.dto';

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

@ApiTags('Body Analyzer')
@Controller('v1/body-analyzer')
export class BodyAnalyzerController {
  private readonly logger = new Logger(BodyAnalyzerController.name);

  constructor(private readonly bodyAnalyzerService: BodyAnalyzerService) {}

  /**
   * Analyze body attributes from base64 image JSON
   */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Analyze body attributes from base64 image',
    description:
      'Accepts a base64 encoded image (with or without data URI prefix) and returns detected attributes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Body analysis completed successfully',
    type: BodyAnalysisResultDto,
  })
  async analyzeBody(@Body() request: AnalyzeBodyDto): Promise<BodyAnalysisResultDto> {
    this.logger.log('Processing body analysis request (base64 JSON)');
    return this.bodyAnalyzerService.analyzeImage(request.imageBase64);
  }

  /**
   * Analyze body attributes from uploaded image (multipart)
   *
   * NOTE: Field name is `photo` to match the existing Aura creation flow.
   */
  @Post('analyze-image')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Analyze body attributes from uploaded image',
    description:
      'Upload an image file (JPEG/PNG/WebP) to analyze skin tone, body shape, and whether a full body is present.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, or WebP)',
        },
      },
      required: ['photo'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Body analysis completed successfully',
    type: BodyAnalysisResultDto,
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

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as any)) {
      return {
        success: false,
        skinHexes: [],
        fullBody: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
      };
    }

    return this.bodyAnalyzerService.analyzeImageBuffer(file.buffer, file.mimetype);
  }
}