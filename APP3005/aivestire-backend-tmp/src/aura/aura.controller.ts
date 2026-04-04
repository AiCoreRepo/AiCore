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
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
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
  private static readonly STREAM_HEARTBEAT_INTERVAL_MS = 15000;
  private static readonly STREAM_POLL_INTERVAL_MS = 1000;

  constructor(
    private readonly auraService: AuraService,
    private readonly bodyAnalyzerService: BodyAnalyzerService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
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

  @Post('stream')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async createAuraStream(
    @CurrentUser('user_id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() createAuraDto: CreateAuraDto,
    @Res() res: Response,
  ): Promise<void> {
    this.validateAuraPhoto(file, true);
    await this.streamAuraLifecycle(
      async () => this.auraService.createAura(userId, file, createAuraDto),
      res,
    );
  }

  @Post('recreate')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async recreateAura(
    @CurrentUser('user_id') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() recreateAuraDto: CreateAuraDto,
    @Req() req: Request,
  ) {
    if (file) {
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
    }

    return this.auraService.recreateAura(userId, file, recreateAuraDto, req);
  }

  @Post('recreate/stream')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async recreateAuraStream(
    @CurrentUser('user_id') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() recreateAuraDto: CreateAuraDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.validateAuraPhoto(file, false);
    await this.streamAuraLifecycle(
      async () =>
        this.auraService.recreateAura(userId, file, recreateAuraDto, req),
      res,
    );
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

  @Patch('avatars/:avatarId/select')
  @UseGuards(JwtAuthGuard)
  async selectAvatarForTryOns(
    @CurrentUser('user_id') userId: string,
    @Param('avatarId') avatarId: string,
  ) {
    return this.auraService.selectAvatarForTryOns(userId, avatarId);
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

  private validateAuraPhoto(
    file: Express.Multer.File | undefined,
    required: boolean,
  ): void {
    if (!file) {
      if (required) {
        throw new BadRequestException('Photo is required');
      }
      return;
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

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 10MB');
    }
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

  private async streamAuraLifecycle(
    startRequest: () => Promise<Record<string, any>>,
    res: Response,
  ): Promise<void> {
    let clientClosed = false;
    this.prepareStreamResponse(res);

    const heartbeat = setInterval(() => {
      this.writeStreamEvent(res, 'keepalive', {
        timestamp: new Date().toISOString(),
      });
    }, AuraController.STREAM_HEARTBEAT_INTERVAL_MS);

    res.on('close', () => {
      clientClosed = true;
      clearInterval(heartbeat);
    });

    this.writeStreamEvent(res, 'ready', {
      success: true,
      message: 'Aura stream connected',
      timestamp: new Date().toISOString(),
    });

    try {
      const accepted = await startRequest();
      const jobId =
        typeof accepted.job_id === 'string' ? accepted.job_id : undefined;

      this.writeStreamEvent(res, 'accepted', {
        ...accepted,
        message: 'Aura job accepted and queued successfully',
        progress: 8,
        timestamp: new Date().toISOString(),
      });

      if (!jobId) {
        throw new BadRequestException('Aura job did not return a valid job id');
      }

      let lastSnapshot = '';

      while (!clientClosed) {
        const status = await this.auraService.getJobStatus(jobId);
        const payload = {
          jobId,
          status: status.status,
          progress: status.progress,
          phase: this.getAuraStreamPhase(status.progress),
          message: this.getAuraStreamMessage(
            status.status,
            status.progress,
            status.error,
          ),
          result: status.result,
          error: status.error,
          timestamp: new Date().toISOString(),
        };
        const snapshot = JSON.stringify({
          status: payload.status,
          progress: payload.progress,
          error: payload.error,
          hasResult: Boolean(payload.result),
        });

        if (snapshot !== lastSnapshot) {
          this.writeStreamEvent(res, 'status', payload);
          lastSnapshot = snapshot;
        }

        if (
          payload.status === 'completed' ||
          payload.status === 'failed' ||
          payload.status === 'not_found'
        ) {
          if (payload.status === 'completed' && payload.result) {
            this.writeStreamEvent(res, 'result', payload.result);
          }
          break;
        }

        await this.sleep(AuraController.STREAM_POLL_INTERVAL_MS);
      }
    } catch (error) {
      this.writeStreamEvent(res, 'error', {
        message: error instanceof Error ? error.message : 'Aura stream failed',
        timestamp: new Date().toISOString(),
      });
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

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getAuraStreamPhase(progress: number): string {
    if (progress >= 100) {
      return 'completed';
    }
    if (progress >= 90) {
      return 'saving';
    }
    if (progress >= 50) {
      return 'uploading';
    }
    if (progress >= 20) {
      return 'generating';
    }
    if (progress >= 10) {
      return 'preparing';
    }

    return 'queued';
  }

  private getAuraStreamMessage(
    status: string,
    progress: number,
    error?: string,
  ): string {
    if (status === 'failed') {
      return error || 'Aura generation failed';
    }

    if (status === 'completed') {
      return 'Aura generation completed';
    }

    if (status === 'waiting' || status === 'paused' || status === 'delayed') {
      return 'Queued for Aura generation';
    }

    if (progress >= 90) {
      return 'Saving your Aura profile';
    }

    if (progress >= 50) {
      return 'Uploading your generated Aura';
    }

    if (progress >= 20) {
      return 'Generating your Aura with Gemini';
    }

    if (progress >= 10) {
      return 'Preparing your source image';
    }

    return 'Starting Aura generation';
  }
}
