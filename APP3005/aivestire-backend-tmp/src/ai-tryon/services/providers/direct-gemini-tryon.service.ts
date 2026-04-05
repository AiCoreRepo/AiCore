import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import _ from 'lodash';
import { BaseTryOnService } from '../common/base-tryon.service';
import { ImageValidatorService } from '../common/image-validator.service';
import { ImageOptimizerService } from '../../../common/image-optimizer.service';
import {
  AIProvider,
  TryOnErrorCode,
  TryOnStatus,
} from '../../enums/ai-provider.enum';
import { TryOnResponseDto } from '../../dto/tryon-response.dto';
import {
  AIServiceException,
  ConfigurationException,
  RateLimitException,
  TimeoutException,
  TryOnException,
} from '../../exceptions/tryon.exceptions';
import {
  buildGeminiTryOnPrompt,
  CONFIG_KEYS,
  ERROR_MESSAGES,
  GEMINI_AI_TIMEOUT,
  GEMINI_AI_TRYON_PROMPT_STRICT_SUFFIX,
  GEMINI_TRYON_CONFIG,
  GEMINI_CLOTHING_MODEL_MASK,
  GEMINI_TRYON_ERROR_MESSAGES,
  TRYON_INPUT_IMAGE_OPTIMIZATION,
  TRYON_RESULT_IMAGE_OUTPUT,
} from '../../constants/tryon.constants';
import type { CompressionOptions } from '../../../common/image-optimizer.service';
import {
  buildDataUri,
  extractImageData,
  GeminiInlineData,
} from './direct-gemini-tryon-image-utils';

const ADDITIONAL_PARAM_KEYS = {
  PROMPT: 'prompt',
  OUTPUT_MIME_TYPE: 'outputMimeType',
  MASK_CLOTHING_MODEL: 'maskClothingModel',
} as const;

const DEFAULT_GEMINI_RATE_LIMIT_COOLDOWN_MS = 60_000;
const GEMINI_RATE_LIMIT_MESSAGE =
  'Gemini try-on is temporarily unavailable because the current Gemini quota has been exhausted. Please retry later or use Vertex try-on if available.';

interface GeminiPart {
  inlineData?: GeminiInlineData;
  text?: string;
}

interface GeminiContent {
  parts?: GeminiPart[];
}

interface GeminiCandidate {
  content?: GeminiContent;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

interface GeminiGenerateResult {
  response: GeminiResponse;
}

type GeminiTryOnStreamEvent =
  | {
      type: 'status';
      phase: string;
      progress: number;
      message: string;
      timestamp: string;
    }
  | {
      type: 'chunk';
      text: string;
      timestamp: string;
    }
  | {
      type: 'preview';
      resultImage: string;
      mimeType: string;
      progress: number;
      timestamp: string;
    };

/**
 * Direct Gemini AI Try-On Service
 * Calls Gemini AI directly without FastAPI intermediary
 */
@Injectable()
export class DirectGeminiTryOnService extends BaseTryOnService {
  private readonly apiKey: string;
  private readonly modelId: string;
  private readonly genAI: GoogleGenerativeAI | null;
  private readonly timingLogsEnabled: boolean;
  private readonly rateLimitCooldownMs: number;
  private rateLimitUntil = 0;

  constructor(
    imageValidator: ImageValidatorService,
    private readonly configService: ConfigService,
    private readonly imageOptimizer: ImageOptimizerService,
  ) {
    super(imageValidator, AIProvider.GEMINI_AI);

    this.apiKey =
      this.configService.get<string>(CONFIG_KEYS.GEMINI_API_KEY) || '';
    this.modelId = GEMINI_TRYON_CONFIG.DEFAULT_MODEL;
    this.timingLogsEnabled =
      String(this.configService.get<string>('AI_TIMING_LOGS') || '').toLowerCase() ===
      'true';
    this.rateLimitCooldownMs = this.parsePositiveInteger(
      this.configService.get<string>('GEMINI_RATE_LIMIT_COOLDOWN_MS'),
      DEFAULT_GEMINI_RATE_LIMIT_COOLDOWN_MS,
    );

    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;

    if (this.isConfigured()) {
      this.logger.log('✅ Direct Gemini AI service configured');
      this.logger.log(`   Model: ${this.modelId}`);
    } else {
      this.logger.warn('⚠️ Direct Gemini AI service not fully configured');
    }
  }

  /**
   * Perform virtual try-on by calling Gemini AI directly
   */
  async processTryOn(
    avatarImage: string,
    clothingImage: string,
    additionalParams?: Record<string, any>,
  ): Promise<TryOnResponseDto> {
    this.throwIfRateLimited();
    return super.processTryOn(avatarImage, clothingImage, additionalParams);
  }

  protected async performTryOn(
    avatarBase64: string,
    clothingBase64: string,
    additionalParams?: Record<string, any>,
  ): Promise<string> {
    if (!this.isConfigured() || !this.genAI) {
      throw new ConfigurationException(ERROR_MESSAGES.MISSING_API_KEY, {
        configKey: CONFIG_KEYS.GEMINI_API_KEY,
      });
    }

    this.throwIfRateLimited();
    this.logger.log('🟢 DIRECT GEMINI AI - Starting try-on process...');

    const totalStartTime = Date.now();
    let avatarExtractMs = 0;
    let clothingExtractMs = 0;
    let maskMs = 0;
    let promptMs = 0;

    try {
      const avatarExtractStart = Date.now();
      const avatarData = await extractImageData(avatarBase64);
      avatarExtractMs = Date.now() - avatarExtractStart;

      const clothingExtractStart = Date.now();
      const originalClothingData = await extractImageData(clothingBase64);
      clothingExtractMs = Date.now() - clothingExtractStart;

      const maskStart = Date.now();
      const clothingData = await this.maskClothingModel(
        originalClothingData,
        additionalParams,
      );
      maskMs = Date.now() - maskStart;

      const promptStart = Date.now();
      const prompt = this.buildPrompt(additionalParams);
      promptMs = Date.now() - promptStart;

      const generationStart = Date.now();
      const primaryImage = await this.generateTryOnWithModel(
        this.modelId,
        prompt,
        avatarData,
        clothingData,
      );
      const generationMs = Date.now() - generationStart;

      const outputBuildStart = Date.now();
      const outputMimeType = this.getOutputMimeType(additionalParams);
      const resultDataUri = buildDataUri(primaryImage, outputMimeType);
      const outputBuildMs = Date.now() - outputBuildStart;
      const totalMs = Date.now() - totalStartTime;

      this.logger.log('✅ DIRECT GEMINI AI - Try-on completed successfully');
      this.logTiming(
        `success total=${this.formatDuration(totalMs)} model=${this.formatDuration(generationMs)} avatar_extract=${this.formatDuration(avatarExtractMs)} clothing_extract=${this.formatDuration(clothingExtractMs)} mask=${this.formatDuration(maskMs)} prompt=${this.formatDuration(promptMs)} output=${this.formatDuration(outputBuildMs)}`,
      );

      return resultDataUri;
    } catch (error) {
      const totalMs = Date.now() - totalStartTime;
      this.logTiming(
        `failed total=${this.formatDuration(totalMs)} avatar_extract=${this.formatDuration(avatarExtractMs)} clothing_extract=${this.formatDuration(clothingExtractMs)} mask=${this.formatDuration(maskMs)} prompt=${this.formatDuration(promptMs)} error=${error instanceof Error ? error.message : 'unknown error'}`,
      );

      throw this.mapProviderError(error);
    }
  }

  protected async optimizePreprocessedImages({
    avatarBase64,
    clothingBase64,
  }: {
    avatarBase64: string;
    clothingBase64: string;
  }): Promise<{ avatarBase64: string; clothingBase64: string }> {
    const [optimizedAvatar, optimizedClothing] = await Promise.all([
      this.optimizeInputImage(
        'avatar',
        avatarBase64,
        TRYON_INPUT_IMAGE_OPTIMIZATION.AVATAR,
      ),
      this.optimizeInputImage(
        'clothing',
        clothingBase64,
        TRYON_INPUT_IMAGE_OPTIMIZATION.CLOTHING,
      ),
    ]);

    return {
      avatarBase64: optimizedAvatar,
      clothingBase64: optimizedClothing,
    };
  }

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    return this.isConfigured() && !this.getRemainingRateLimitSeconds();
  }

  async processTryOnStream(
    avatarImage: string,
    clothingImage: string,
    additionalParams?: Record<string, any>,
    onEvent?: (event: GeminiTryOnStreamEvent) => Promise<void> | void,
  ): Promise<TryOnResponseDto> {
    const startTime = Date.now();

    try {
      this.throwIfRateLimited();
      await this.emitStreamEvent(onEvent, {
        type: 'status',
        phase: 'validating',
        progress: 5,
        message: 'Analyzing your photos',
        timestamp: new Date().toISOString(),
      });
      await this.validateImages(avatarImage, clothingImage);

      await this.emitStreamEvent(onEvent, {
        type: 'status',
        phase: 'preprocessing',
        progress: 15,
        message: 'Preparing your look',
        timestamp: new Date().toISOString(),
      });
      const { avatarBase64, clothingBase64 } = await this.preprocessImages(
        avatarImage,
        clothingImage,
      );

      await this.emitStreamEvent(onEvent, {
        type: 'status',
        phase: 'generating',
        progress: 30,
        message: 'Styling your selected look',
        timestamp: new Date().toISOString(),
      });
      const resultImage = await this.performTryOnStreamed(
        avatarBase64,
        clothingBase64,
        additionalParams,
        onEvent,
      );

      await this.emitStreamEvent(onEvent, {
        type: 'status',
        phase: 'postprocessing',
        progress: 85,
        message: 'Finalizing your look',
        timestamp: new Date().toISOString(),
      });
      const finalImage = await this.postprocessResult(resultImage);
      const processingTimeMs = Date.now() - startTime;

      await this.emitStreamEvent(onEvent, {
        type: 'status',
        phase: 'completed',
        progress: 100,
        message: 'Try-on completed',
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        resultImage: finalImage,
        provider: this.provider,
        status: TryOnStatus.SUCCESS,
        processingTimeMs,
        metadata: {
          ...additionalParams,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      this.logger.error(
        `Streamed try-on failed after ${processingTimeMs}ms: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Get configuration status
   */
  getConfigurationStatus(): { configured: boolean; message?: string } {
    if (!this.apiKey) {
      return {
        configured: false,
        message: GEMINI_TRYON_ERROR_MESSAGES.MISSING_API_KEY,
      };
    }

    const retryAfterSeconds = this.getRemainingRateLimitSeconds();
    if (retryAfterSeconds) {
      return {
        configured: true,
        message: `Direct Gemini AI: ${this.modelId} (rate limited, retry in ${retryAfterSeconds}s)`,
      };
    }

    return {
      configured: true,
      message: `Direct Gemini AI: ${this.modelId}`,
    };
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  protected async performTryOnWithRetry(
    avatarBase64: string,
    clothingBase64: string,
    additionalParams?: Record<string, any>,
  ): Promise<string> {
    this.logger.debug('Gemini try-on uses a single generation attempt');
    return this.performTryOn(avatarBase64, clothingBase64, additionalParams);
  }

  protected async postprocessResult(resultImage: string): Promise<string> {
    return this.imageOptimizer.normalizeToPortraitCanvas(resultImage, {
      targetAspectRatio: TRYON_RESULT_IMAGE_OUTPUT.TARGET_ASPECT_RATIO,
      maxWidth: TRYON_RESULT_IMAGE_OUTPUT.MAX_WIDTH,
      maxHeight: TRYON_RESULT_IMAGE_OUTPUT.MAX_HEIGHT,
      quality: TRYON_RESULT_IMAGE_OUTPUT.QUALITY,
      format: TRYON_RESULT_IMAGE_OUTPUT.FORMAT,
    });
  }

  private async optimizeInputImage(
    label: 'avatar' | 'clothing',
    imageDataUri: string,
    options: CompressionOptions,
  ): Promise<string> {
    try {
      return await this.imageOptimizer.compressImage(imageDataUri, options);
    } catch (error) {
      this.logger.warn(
        `Failed to optimize ${label} image for Gemini try-on, using original input: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return imageDataUri;
    }
  }

  private buildPrompt(additionalParams?: Record<string, any>): string {
    const promptOverride = _.get(
      additionalParams,
      ADDITIONAL_PARAM_KEYS.PROMPT,
    );
    const basePrompt =
      _.isString(promptOverride) && promptOverride.trim()
        ? promptOverride.trim()
        : buildGeminiTryOnPrompt(_.get(additionalParams, 'aura_attributes'));

    return `${basePrompt}${GEMINI_AI_TRYON_PROMPT_STRICT_SUFFIX}`;
  }

  private getOutputMimeType(additionalParams?: Record<string, any>): string {
    const outputMimeType = _.get(
      additionalParams,
      ADDITIONAL_PARAM_KEYS.OUTPUT_MIME_TYPE,
    );

    if (_.isString(outputMimeType) && outputMimeType.trim()) {
      return outputMimeType;
    }

    return GEMINI_TRYON_CONFIG.DEFAULT_MIME_TYPE;
  }

  private extractTryOnImage(response: GeminiResponse): string {
    return this.extractTryOnImagePart(response).data;
  }

  private extractTryOnImagePart(response: GeminiResponse): GeminiInlineData {
    if (!response || !response.candidates) {
      throw new AIServiceException(
        TryOnErrorCode.PROCESSING_FAILED,
        GEMINI_TRYON_ERROR_MESSAGES.INVALID_RESPONSE,
        500,
        { response },
      );
    }

    const parts = _.flatMap(
      response.candidates,
      (candidate) => candidate.content?.parts ?? [],
    );
    const imageParts = _.filter(parts, (part) =>
      _.get(part, 'inlineData.data'),
    );
    const imageDataList = _.map(imageParts, (part) => ({
      data: part.inlineData?.data ?? '',
      mimeType:
        part.inlineData?.mimeType || GEMINI_TRYON_CONFIG.DEFAULT_MIME_TYPE,
    }));

    const validImageDataList = _.filter(
      imageDataList,
      (imageData) => !!imageData.data,
    );

    if (!validImageDataList.length) {
      throw new AIServiceException(
        TryOnErrorCode.PROCESSING_FAILED,
        GEMINI_TRYON_ERROR_MESSAGES.NO_IMAGE_DATA,
        500,
        { response },
      );
    }

    const [bestImage] = _.orderBy(
      validImageDataList,
      (imageData) => imageData.data.length,
      ['desc'],
    );

    return bestImage || validImageDataList[0];
  }

  private async generateTryOnWithModel(
    modelId: string,
    prompt: string,
    avatarData: GeminiInlineData,
    clothingData: GeminiInlineData,
  ): Promise<string> {
    if (!this.genAI) {
      throw new AIServiceException(
        TryOnErrorCode.AI_SERVICE_ERROR,
        GEMINI_TRYON_ERROR_MESSAGES.REQUEST_FAILED,
        500,
      );
    }

    const model = this.genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        temperature: 0.2,
      } as any,
    });

    const generationPromise = model.generateContent([
      {
        inlineData: {
          data: clothingData.data,
          mimeType: clothingData.mimeType,
        },
      },
      {
        inlineData: {
          data: avatarData.data,
          mimeType: avatarData.mimeType,
        },
      },
      { text: prompt },
    ]);

    const result = await this.withTimeout(generationPromise, GEMINI_AI_TIMEOUT);
    const response = (result as GeminiGenerateResult).response;

    const imageBase64 = this.extractTryOnImage(response);
    return imageBase64;
  }

  private async performTryOnStreamed(
    avatarBase64: string,
    clothingBase64: string,
    additionalParams?: Record<string, any>,
    onEvent?: (event: GeminiTryOnStreamEvent) => Promise<void> | void,
  ): Promise<string> {
    if (!this.isConfigured() || !this.genAI) {
      throw new ConfigurationException(ERROR_MESSAGES.MISSING_API_KEY, {
        configKey: CONFIG_KEYS.GEMINI_API_KEY,
      });
    }

    this.throwIfRateLimited();
    const totalStartTime = Date.now();
    let avatarExtractMs = 0;
    let clothingExtractMs = 0;
    let maskMs = 0;
    let promptMs = 0;

    try {
      const avatarExtractStart = Date.now();
      const avatarData = await extractImageData(avatarBase64);
      avatarExtractMs = Date.now() - avatarExtractStart;

      const clothingExtractStart = Date.now();
      const originalClothingData = await extractImageData(clothingBase64);
      clothingExtractMs = Date.now() - clothingExtractStart;

      const maskStart = Date.now();
      const clothingData = await this.maskClothingModel(
        originalClothingData,
        additionalParams,
      );
      maskMs = Date.now() - maskStart;

      const promptStart = Date.now();
      const prompt = this.buildPrompt(additionalParams);
      promptMs = Date.now() - promptStart;

      await this.emitStreamEvent(onEvent, {
        type: 'status',
        phase: 'generating',
        progress: 40,
        message: 'Rendering your virtual try-on',
        timestamp: new Date().toISOString(),
      });

      const generationStart = Date.now();
      const primaryImage = await this.generateTryOnWithModelStream(
        this.modelId,
        prompt,
        avatarData,
        clothingData,
        onEvent,
      );
      const generationMs = Date.now() - generationStart;

      const totalMs = Date.now() - totalStartTime;
      this.logTiming(
        `stream_success total=${this.formatDuration(totalMs)} model=${this.formatDuration(generationMs)} avatar_extract=${this.formatDuration(avatarExtractMs)} clothing_extract=${this.formatDuration(clothingExtractMs)} mask=${this.formatDuration(maskMs)} prompt=${this.formatDuration(promptMs)}`,
      );

      return buildDataUri(
        primaryImage,
        this.getOutputMimeType(additionalParams),
      );
    } catch (error) {
      const totalMs = Date.now() - totalStartTime;
      this.logTiming(
        `stream_failed total=${this.formatDuration(totalMs)} avatar_extract=${this.formatDuration(avatarExtractMs)} clothing_extract=${this.formatDuration(clothingExtractMs)} mask=${this.formatDuration(maskMs)} prompt=${this.formatDuration(promptMs)} error=${error instanceof Error ? error.message : 'unknown error'}`,
      );

      throw this.mapProviderError(error);
    }
  }

  private async generateTryOnWithModelStream(
    modelId: string,
    prompt: string,
    avatarData: GeminiInlineData,
    clothingData: GeminiInlineData,
    onEvent?: (event: GeminiTryOnStreamEvent) => Promise<void> | void,
  ): Promise<string> {
    if (!this.genAI) {
      throw new AIServiceException(
        TryOnErrorCode.AI_SERVICE_ERROR,
        GEMINI_TRYON_ERROR_MESSAGES.REQUEST_FAILED,
        500,
      );
    }

    const model = this.genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        temperature: 0.2,
      } as any,
    });

    const request = [
      {
        inlineData: {
          data: clothingData.data,
          mimeType: clothingData.mimeType,
        },
      },
      {
        inlineData: {
          data: avatarData.data,
          mimeType: avatarData.mimeType,
        },
      },
      { text: prompt },
    ];

    const streamMethod = (model as any).generateContentStream;
    if (typeof streamMethod !== 'function') {
      await this.emitStreamEvent(onEvent, {
        type: 'status',
        phase: 'fallback',
        progress: 45,
        message: 'Rendering your virtual try-on',
        timestamp: new Date().toISOString(),
      });
      return this.generateTryOnWithModel(
        modelId,
        prompt,
        avatarData,
        clothingData,
      );
    }

    const streamPromise = (async () => {
      const streamed = await streamMethod.call(model, request);
      const stream = streamed?.stream;
      let streamedImage: GeminiInlineData | null = null;

      if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
        for await (const chunk of stream as AsyncIterable<any>) {
          const chunkText = this.extractTextFromChunk(chunk);
          if (chunkText) {
            await this.emitStreamEvent(onEvent, {
              type: 'chunk',
              text: chunkText,
              timestamp: new Date().toISOString(),
            });
          }

          const chunkImage = this.tryExtractImagePartFromPayload(chunk);
          if (chunkImage && chunkImage.data !== streamedImage?.data) {
            streamedImage = chunkImage;
            await this.emitStreamEvent(onEvent, {
              type: 'preview',
              resultImage: buildDataUri(chunkImage.data, chunkImage.mimeType),
              mimeType: chunkImage.mimeType,
              progress: 72,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      if (streamed?.response) {
        const finalResponse = await streamed.response;
        const finalImage = this.tryExtractImagePartFromPayload(
          finalResponse as GeminiResponse,
        );
        if (finalImage) {
          if (finalImage.data !== streamedImage?.data) {
            await this.emitStreamEvent(onEvent, {
              type: 'preview',
              resultImage: buildDataUri(finalImage.data, finalImage.mimeType),
              mimeType: finalImage.mimeType,
              progress: 82,
              timestamp: new Date().toISOString(),
            });
          }
          return finalImage.data;
        }

        if (streamedImage) {
          this.logger.warn(
            'Gemini stream final response omitted inline image data; using image captured from streamed chunks',
          );
          return streamedImage.data;
        }
      }

      if (streamedImage) {
        return streamedImage.data;
      }

      throw new AIServiceException(
        TryOnErrorCode.PROCESSING_FAILED,
        GEMINI_TRYON_ERROR_MESSAGES.NO_IMAGE_DATA,
        500,
      );
    })();

    return this.withTimeout(streamPromise, GEMINI_AI_TIMEOUT);
  }

  private async maskClothingModel(
    clothingData: GeminiInlineData,
    additionalParams?: Record<string, any>,
  ): Promise<GeminiInlineData> {
    const maskOverride = _.get(
      additionalParams,
      ADDITIONAL_PARAM_KEYS.MASK_CLOTHING_MODEL,
    );

    if (_.isBoolean(maskOverride)) {
      return maskOverride
        ? this.applyTopRegionBlur(clothingData)
        : clothingData;
    }

    if (!GEMINI_CLOTHING_MODEL_MASK.ENABLED_BY_DEFAULT) {
      return clothingData;
    }

    return this.applyTopRegionBlur(clothingData);
  }

  private async applyTopRegionBlur(
    clothingData: GeminiInlineData,
  ): Promise<GeminiInlineData> {
    try {
      const { default: sharp } = await import('sharp');
      const buffer = Buffer.from(clothingData.data, 'base64');
      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        return clothingData;
      }

      const maskHeight = Math.max(
        1,
        Math.round(
          metadata.height * GEMINI_CLOTHING_MODEL_MASK.TOP_REGION_RATIO,
        ),
      );

      const blurred = await image
        .clone()
        .blur(GEMINI_CLOTHING_MODEL_MASK.BLUR_SIGMA)
        .toBuffer();

      const blurredTop = await sharp(blurred)
        .extract({
          left: 0,
          top: 0,
          width: metadata.width,
          height: maskHeight,
        })
        .toBuffer();

      const composited = await image
        .composite([{ input: blurredTop, top: 0, left: 0 }])
        .toBuffer();

      return {
        data: composited.toString('base64'),
        mimeType: clothingData.mimeType,
      };
    } catch (error) {
      this.logger.warn(
        `Clothing model mask failed, using original image: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return clothingData;
    }
  }

  private logTiming(message: string): void {
    if (!this.timingLogsEnabled) {
      return;
    }

    this.logger.log(`[GeminiTryOnTiming] ${message}`);
  }

  private formatDuration(durationMs: number): string {
    return `${durationMs}ms/${(durationMs / 1000).toFixed(2)}s`;
  }

  private async emitStreamEvent(
    onEvent: ((event: GeminiTryOnStreamEvent) => Promise<void> | void) | undefined,
    event: GeminiTryOnStreamEvent,
  ): Promise<void> {
    if (!onEvent) {
      return;
    }

    await onEvent(event);
  }

  private extractTextFromChunk(chunk: any): string {
    try {
      if (typeof chunk?.text === 'function') {
        const text = chunk.text();
        return _.isString(text) ? text : '';
      }

      const parts = _.flatMap(
        chunk?.candidates ?? [],
        (candidate) => candidate?.content?.parts ?? [],
      );
      return _.chain(parts)
        .map((part) => part?.text)
        .filter(_.isString)
        .join('\n')
        .trim()
        .value();
    } catch {
      return '';
    }
  }

  private tryExtractImagePartFromPayload(
    payload: unknown,
  ): GeminiInlineData | null {
    try {
      return this.extractTryOnImagePart(payload as GeminiResponse);
    } catch {
      return null;
    }
  }

  private mapProviderError(error: unknown): TryOnException {
    if (error instanceof TimeoutException) {
      return new AIServiceException(
        TryOnErrorCode.TIMEOUT_ERROR,
        GEMINI_TRYON_ERROR_MESSAGES.REQUEST_TIMEOUT,
        504,
        { timeout: GEMINI_AI_TIMEOUT },
      );
    }

    if (error instanceof TryOnException) {
      return error;
    }

    if (this.isRateLimitError(error)) {
      const retryAfterSeconds =
        this.getRetryAfterSeconds(error) ??
        Math.max(1, Math.ceil(this.rateLimitCooldownMs / 1000));
      this.rateLimitUntil = Math.max(
        this.rateLimitUntil,
        Date.now() + retryAfterSeconds * 1000,
      );

      this.logger.warn(
        `Gemini quota exhausted, entering cooldown for ${retryAfterSeconds}s: ${this.getProviderErrorMessage(error)}`,
      );

      return new RateLimitException(
        GEMINI_RATE_LIMIT_MESSAGE,
        retryAfterSeconds,
      );
    }

    const errorMessage = this.getProviderErrorMessage(error);
    return new AIServiceException(
      TryOnErrorCode.AI_SERVICE_ERROR,
      GEMINI_TRYON_ERROR_MESSAGES.REQUEST_FAILED,
      500,
      { error: errorMessage },
    );
  }

  private throwIfRateLimited(): void {
    const retryAfterSeconds = this.getRemainingRateLimitSeconds();
    if (!retryAfterSeconds) {
      return;
    }

    throw new RateLimitException(GEMINI_RATE_LIMIT_MESSAGE, retryAfterSeconds);
  }

  private getRemainingRateLimitSeconds(): number | null {
    const remainingMs = this.rateLimitUntil - Date.now();
    if (remainingMs <= 0) {
      return null;
    }

    return Math.max(1, Math.ceil(remainingMs / 1000));
  }

  private isRateLimitError(error: unknown): boolean {
    const statusCode = this.getProviderStatusCode(error);
    if (statusCode === 429) {
      return true;
    }

    const message = this.getProviderErrorMessage(error).toLowerCase();
    return (
      message.includes('too many requests') ||
      message.includes('rate limit') ||
      message.includes('current quota') ||
      message.includes('quota exceeded') ||
      message.includes('resource exhausted')
    );
  }

  private getProviderStatusCode(error: unknown): number | null {
    const rawValues = [
      _.get(error, 'status'),
      _.get(error, 'statusCode'),
      _.get(error, 'response.status'),
      _.get(error, 'response.statusCode'),
      _.get(error, 'error.status'),
      _.get(error, 'error.statusCode'),
      _.get(error, 'cause.status'),
      _.get(error, 'cause.statusCode'),
    ];

    for (const rawValue of rawValues) {
      const parsedValue = this.parsePositiveInteger(rawValue, 0);
      if (parsedValue > 0) {
        return parsedValue;
      }
    }

    return null;
  }

  private getRetryAfterSeconds(error: unknown): number | null {
    const rawValues = [
      _.get(error, 'retryAfter'),
      _.get(error, 'retryAfterSeconds'),
      _.get(error, 'details.retryAfter'),
      _.get(error, 'response.retryAfter'),
      _.get(error, 'response.headers.retry-after'),
      _.get(error, 'headers.retry-after'),
    ];

    for (const rawValue of rawValues) {
      const parsedValue = this.parsePositiveInteger(rawValue, 0);
      if (parsedValue > 0) {
        return parsedValue;
      }
    }

    return null;
  }

  private getProviderErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    const rawMessage =
      _.get(error, 'message') ??
      _.get(error, 'response.message') ??
      _.get(error, 'error.message');

    return _.isString(rawMessage) && rawMessage.trim()
      ? rawMessage
      : GEMINI_TRYON_ERROR_MESSAGES.REQUEST_FAILED;
  }

  private parsePositiveInteger(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value);
    }

    if (typeof value === 'string') {
      const parsedValue = Number.parseInt(value, 10);
      if (Number.isFinite(parsedValue) && parsedValue > 0) {
        return parsedValue;
      }
    }

    return fallback;
  }
}
