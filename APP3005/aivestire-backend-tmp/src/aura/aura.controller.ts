import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Get,
  Patch,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuraService } from './aura.service';
import { CreateAuraDto } from './dto/create-aura.dto';
import { UpdateAuraDto } from './dto/update-aura.dto';
import { BodyAnalyzerService } from '../ai-tryon/services/body-analyzer.service';
import { BodyAnalysisResultDto } from '../ai-tryon/dto/body-analyzer.dto';

@Controller('aura')
export class AuraController {
  constructor(
    private readonly auraService: AuraService,
    private readonly bodyAnalyzerService: BodyAnalyzerService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createAura(
    @CurrentUser('user_id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() createAuraDto: CreateAuraDto,
  ) {
    // ... (rest of the method remains the same)
    if (!file) {
      throw new BadRequestException('Photo is required');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    return this.auraService.createAura(userId, file, createAuraDto);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getAuraStatus(@CurrentUser('user_id') userId: string) {
    return this.auraService.hasAura(userId);
  }

  @Get('job/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.auraService.getJobStatus(jobId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyAura(@CurrentUser('user_id') userId: string) {
    return this.auraService.getAuraByUserId(userId);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async updateAura(
    @CurrentUser('user_id') userId: string,
    @Body() updateAuraDto: UpdateAuraDto,
  ) {
    return this.auraService.updateAura(userId, updateAuraDto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async deleteAura(@CurrentUser('user_id') userId: string) {
    return this.auraService.deleteAura(userId);
  }

  @Post('analyze-image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('photo'))
  async analyzeImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BodyAnalysisResultDto> {
    if (!file) {
      throw new BadRequestException('Photo is required');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    console.log('📸 Analyzing image for body attributes...');
    return this.bodyAnalyzerService.analyzeImageBuffer(
      file.buffer,
      file.mimetype,
    );
  }
}
