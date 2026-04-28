import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import {
  BodyAnalysisResultDto,
  FastAPIBodyAnalysisResponse,
} from './dto/body-analyzer.dto';
import {
  AIServiceException,
  ServiceUnavailableException,
} from '../ai-tryon/exceptions/tryon.exceptions';
import { TryOnErrorCode } from '../ai-tryon/enums/ai-provider.enum';

@Injectable()
export class BodyAnalyzerService {
  private readonly logger = new Logger(BodyAnalyzerService.name);
  private readonly fastApiUrl: string;
  private readonly timeoutMs: number;
  private readonly minShorterSide: number;

  constructor(private readonly configService: ConfigService) {
    this.fastApiUrl =
      this.configService.get<string>('FASTAPI_BODY_ANALYZE_URL') ||
      'http://localhost:8000/body_analyze_json';

    this.timeoutMs = Number.parseInt(
      this.configService.get<string>('BODY_ANALYZER_TIMEOUT_MS') || '60000',
      10,
    );

    this.minShorterSide = Number.parseInt(
      this.configService.get<string>('BODY_ANALYZER_MIN_SHORTER_SIDE') || '640',
      10,
    );

    this.logger.log(`BodyAnalyzer FastAPI URL: ${this.fastApiUrl}`);
    this.logger.log(`BodyAnalyzer timeout: ${this.timeoutMs}ms`);
    this.logger.log(
      `BodyAnalyzer minimum shorter side: ${this.minShorterSide}px`,
    );
  }

  async analyzeImage(imageBase64: string): Promise<BodyAnalysisResultDto> {
    const startTime = Date.now();

    try {
      const cleanBase64 = this.extractBase64Data(imageBase64);
      const normalizedBase64 =
        await this.normalizeImageForBodyAnalysis(cleanBase64);
      let analysisInputBase64 = normalizedBase64;

      let response = await this.requestBodyAnalysis(analysisInputBase64);

      if (!response.ok) {
        const firstError = await this.parseFastApiError(response);

        if (this.shouldRetryWithEnhancement(firstError.statusCode, firstError.errorData)) {
          const enhancedBase64 =
            await this.enhanceImageForBodyAnalysis(normalizedBase64);

          if (enhancedBase64 !== normalizedBase64) {
            this.logger.warn(
              'Retrying body analysis once with enhanced image due to low_image_quality blur rejection',
            );

            analysisInputBase64 = enhancedBase64;
            response = await this.requestBodyAnalysis(analysisInputBase64);

            if (!response.ok) {
              const retryError = await this.parseFastApiError(response);
              return this.handleFastApiError(
                retryError.statusCode,
                retryError.errorData,
              );
            }
          } else {
            return this.handleFastApiError(
              firstError.statusCode,
              firstError.errorData,
            );
          }
        } else {
          return this.handleFastApiError(
            firstError.statusCode,
            firstError.errorData,
          );
        }
      }

      const initialResult =
        (await response.json()) as FastAPIBodyAnalysisResponse;
      const result = await this.recoverPartialBodyAnalysis(
        analysisInputBase64,
        initialResult,
      );
      const effectiveFullBody = result.full_body || Boolean(result.body_shape);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        skinToneLabel: result.skin_tone_label,
        skinHexes: result.skin_hexes || [],
        bodyShape: result.body_shape,
        bodyShapeReason: result.body_shape_reason,
        fullBody: effectiveFullBody,
        processingTime,
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      if (error?.name === 'AbortError') {
        return {
          success: false,
          skinHexes: [],
          fullBody: false,
          error: 'Body analysis request timed out. Please try again.',
          processingTime,
        };
      }

      if (error instanceof AIServiceException) {
        throw error;
      }

      this.logger.error(`Body analysis failed: ${error?.message || error}`);
      return {
        success: false,
        skinHexes: [],
        fullBody: false,
        error: `Body analysis failed: ${error?.message || 'Unknown error'}`,
        processingTime,
      };
    }
  }

  async analyzeImageBuffer(
    buffer: Buffer,
    mimetype: string,
  ): Promise<BodyAnalysisResultDto> {
    const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
    return this.analyzeImage(base64);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const baseUrl = this.fastApiUrl
        .replace('/body_analyze_json', '')
        .replace('/body_analyze', '');
      const healthUrl = `${baseUrl}/health`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error: any) {
      this.logger.warn(`Body analyzer health check failed: ${error?.message}`);
      return false;
    }
  }

  getConfigurationStatus(): { configured: boolean; message?: string } {
    return {
      configured: true,
      message: `FastAPI service URL: ${this.fastApiUrl}`,
    };
  }

  private extractBase64Data(base64String: string): string {
    if (base64String.startsWith('data:')) {
      const matches = base64String.match(/^data:[^;]+;base64,(.+)$/);
      return matches ? matches[1] : base64String;
    }

    return base64String;
  }

  private async requestBodyAnalysis(imageBase64: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await fetch(this.fastApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: imageBase64 }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async parseFastApiError(
    response: Response,
  ): Promise<{ statusCode: number; errorData: any }> {
    const statusCode = response.status;
    let errorData: any = {};

    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    return { statusCode, errorData };
  }

  private shouldRetryWithEnhancement(
    statusCode: number,
    errorData: any,
  ): boolean {
    if (statusCode !== 400) {
      return false;
    }

    const detail = errorData?.detail;
    if (!detail || typeof detail !== 'object') {
      return false;
    }

    const code = String((detail as Record<string, any>).code || '').toLowerCase();
    if (code !== 'low_image_quality') {
      return false;
    }

    const reasons = (detail as Record<string, any>).reasons;
    const reasonText = Array.isArray(reasons)
      ? reasons.join(' ').toLowerCase()
      : String((detail as Record<string, any>).message || '').toLowerCase();

    return reasonText.includes('blurry') || reasonText.includes('laplacian');
  }

  private async enhanceImageForBodyAnalysis(base64: string): Promise<string> {
    try {
      const inputBuffer = Buffer.from(base64, 'base64');
      const enhancedBuffer = await sharp(inputBuffer)
        .rotate()
        .normalise()
        .sharpen(1.25, 1.1, 2.0)
        .jpeg({ quality: 96, mozjpeg: true })
        .toBuffer();

      return enhancedBuffer.toString('base64');
    } catch (error: any) {
      this.logger.warn(
        `Failed to enhance image for low quality retry: ${error?.message || error}`,
      );
      return base64;
    }
  }

  private async recoverPartialBodyAnalysis(
    imageBase64: string,
    initialResult: FastAPIBodyAnalysisResponse,
  ): Promise<FastAPIBodyAnalysisResponse> {
    if (initialResult.full_body || initialResult.body_shape) {
      return initialResult;
    }

    const enhancedBase64 = await this.enhanceImageForBodyAnalysis(imageBase64);
    if (enhancedBase64 === imageBase64) {
      return initialResult;
    }

    this.logger.warn(
      'Retrying body analysis once with enhanced image due to partial detection (no body shape)',
    );

    try {
      const retryResponse = await this.requestBodyAnalysis(enhancedBase64);
      if (!retryResponse.ok) {
        return initialResult;
      }

      const retryResult =
        (await retryResponse.json()) as FastAPIBodyAnalysisResponse;
      if (retryResult.full_body || retryResult.body_shape) {
        return retryResult;
      }

      return initialResult;
    } catch (error: any) {
      this.logger.warn(
        `Partial-detection retry failed: ${error?.message || error}`,
      );
      return initialResult;
    }
  }

  private handleFastApiError(statusCode: number, errorData: any): never {

    if (statusCode === 500 && errorData.detail) {
      throw new AIServiceException(
        TryOnErrorCode.PROCESSING_FAILED,
        `Body analysis failed: ${this.formatFastApiDetail(errorData.detail)}`,
        statusCode,
        { fastApiError: errorData },
      );
    }

    if (statusCode === 400) {
      throw new AIServiceException(
        TryOnErrorCode.INVALID_IMAGE_FORMAT,
        `Invalid image for body analysis: ${this.formatFastApiDetail(errorData.detail || errorData.message || 'Bad request')}`,
        statusCode,
        { fastApiError: errorData },
      );
    }

    if (statusCode === 503) {
      throw new ServiceUnavailableException(
        'Body analyzer service is temporarily unavailable',
        { fastApiError: errorData },
      );
    }

    throw new AIServiceException(
      TryOnErrorCode.AI_SERVICE_ERROR,
      `Body analyzer service error: ${this.formatFastApiDetail(errorData.detail || errorData.message || 'Unknown error')}`,
      statusCode,
      { fastApiError: errorData },
    );
  }

  private async normalizeImageForBodyAnalysis(base64: string): Promise<string> {
    try {
      const inputBuffer = Buffer.from(base64, 'base64');
      const metadata = await sharp(inputBuffer).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      if (!width || !height) {
        return base64;
      }

      const shorterSide = Math.min(width, height);
      if (shorterSide >= this.minShorterSide) {
        return base64;
      }

      // Upscale just enough to satisfy analyzer minimum resolution while preserving aspect ratio.
      const resizedBuffer =
        width <= height
          ? await sharp(inputBuffer)
              .resize({
                width: this.minShorterSide,
                withoutEnlargement: false,
                kernel: sharp.kernel.lanczos3,
              })
              .jpeg({ quality: 92 })
              .toBuffer()
          : await sharp(inputBuffer)
              .resize({
                height: this.minShorterSide,
                withoutEnlargement: false,
                kernel: sharp.kernel.lanczos3,
              })
              .jpeg({ quality: 92 })
              .toBuffer();

      const resizedMetadata = await sharp(resizedBuffer).metadata();
      this.logger.log(
        `Upscaled body-analysis image from ${width}x${height} to ${resizedMetadata.width}x${resizedMetadata.height}`,
      );

      return resizedBuffer.toString('base64');
    } catch (error: any) {
      this.logger.warn(
        `Failed to normalize body-analysis image dimensions: ${error?.message || error}`,
      );
      return base64;
    }
  }

  private formatFastApiDetail(detail: unknown): string {
    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail.join(', ');
    }

    if (detail && typeof detail === 'object') {
      const typedDetail = detail as Record<string, any>;
      const codePrefix = typedDetail.code ? `[${typedDetail.code}] ` : '';
      const reasons = Array.isArray(typedDetail.reasons)
        ? typedDetail.reasons.join('; ')
        : undefined;
      const primaryMessage =
        reasons || typedDetail.message || typedDetail.error || 'Invalid request';

      const metrics =
        typedDetail.metrics && typeof typedDetail.metrics === 'object'
          ? ` (w:${typedDetail.metrics.width ?? '?'}, h:${typedDetail.metrics.height ?? '?'}, shorter:${typedDetail.metrics.shorter_side ?? '?'})`
          : '';

      return `${codePrefix}${primaryMessage}${metrics}`.trim();
    }

    return String(detail || 'Unknown error');
  }
}
