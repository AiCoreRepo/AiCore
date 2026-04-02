import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import _ from 'lodash';
import { BaseTryOnService } from '../common/base-tryon.service';
import { ImageValidatorService } from '../common/image-validator.service';
import { ImageOptimizerService } from '../../../common/image-optimizer.service';
import { AIProvider, TryOnErrorCode } from '../../enums/ai-provider.enum';
import {
  AIServiceException,
  ConfigurationException,
  TimeoutException,
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
} from '../../constants/tryon.constants';
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

      if (error instanceof TimeoutException) {
        throw new AIServiceException(
          TryOnErrorCode.TIMEOUT_ERROR,
          GEMINI_TRYON_ERROR_MESSAGES.REQUEST_TIMEOUT,
          504,
          { timeout: GEMINI_AI_TIMEOUT },
        );
      }

      if (error instanceof AIServiceException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : GEMINI_TRYON_ERROR_MESSAGES.REQUEST_FAILED;

      throw new AIServiceException(
        TryOnErrorCode.AI_SERVICE_ERROR,
        GEMINI_TRYON_ERROR_MESSAGES.REQUEST_FAILED,
        500,
        { error: errorMessage },
      );
    }
  }

  /**
   * Override preprocess: keep URLs for direct Gemini fetch
   */
  protected async preprocessImages(
    avatarImage: string,
    clothingImage: string,
  ): Promise<{ avatarBase64: string; clothingBase64: string }> {
    return {
      avatarBase64: avatarImage,
      clothingBase64: clothingImage,
    };
  }

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    return this.isConfigured();
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
      targetAspectRatio: 2 / 3,
      maxWidth: 1200,
      maxHeight: 1800,
      quality: 90,
      format: 'jpeg',
    });
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
    const imageDataList = _.map(
      imageParts,
      (part) => part.inlineData?.data ?? '',
    );

    if (!imageDataList.length) {
      throw new AIServiceException(
        TryOnErrorCode.PROCESSING_FAILED,
        GEMINI_TRYON_ERROR_MESSAGES.NO_IMAGE_DATA,
        500,
        { response },
      );
    }

    const [bestImage] = _.orderBy(imageDataList, (data) => data.length, [
      'desc',
    ]);
    return bestImage || imageDataList[0];
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
}
