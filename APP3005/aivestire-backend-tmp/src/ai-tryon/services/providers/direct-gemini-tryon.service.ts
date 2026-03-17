import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createHash } from 'crypto';
import _ from 'lodash';
import { BaseTryOnService } from '../common/base-tryon.service';
import { ImageValidatorService } from '../common/image-validator.service';
import { AIProvider, TryOnErrorCode } from '../../enums/ai-provider.enum';
import {
  AIServiceException,
  ConfigurationException,
  TimeoutException,
} from '../../exceptions/tryon.exceptions';
import {
  CONFIG_KEYS,
  ERROR_MESSAGES,
  GEMINI_AI_TIMEOUT,
  GEMINI_AI_TRYON_PROMPT,
  GEMINI_AI_TRYON_PROMPT_STRICT_SUFFIX,
  GEMINI_TRYON_CONFIG,
  GEMINI_CLOTHING_MODEL_MASK,
  GEMINI_TRYON_OUTPUT_VALIDATION,
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

  constructor(
    imageValidator: ImageValidatorService,
    private readonly configService: ConfigService,
  ) {
    super(imageValidator, AIProvider.GEMINI_AI);

    this.apiKey =
      this.configService.get<string>(CONFIG_KEYS.GEMINI_API_KEY) || '';
    this.modelId = GEMINI_TRYON_CONFIG.DEFAULT_MODEL;

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

    const avatarData = await extractImageData(avatarBase64);
    const originalClothingData = await extractImageData(clothingBase64);
    const clothingData = await this.maskClothingModel(
      originalClothingData,
      additionalParams,
    );
    const prompt = this.buildPrompt(additionalParams);

    try {
      const primaryImage = await this.generateTryOnWithRetries({
        avatarData,
        clothingData,
        originalClothingData,
        prompt,
      });
      const outputMimeType = this.getOutputMimeType(additionalParams);

      this.logger.log('✅ DIRECT GEMINI AI - Try-on completed successfully');

      return buildDataUri(primaryImage, outputMimeType);
    } catch (error) {
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


  private buildPrompt(additionalParams?: Record<string, any>): string {
    const promptOverride = _.get(additionalParams, ADDITIONAL_PARAM_KEYS.PROMPT);
    if (_.isString(promptOverride) && promptOverride.trim()) {
      return promptOverride;
    }
    return GEMINI_AI_TRYON_PROMPT;
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

  private buildStrictPrompt(prompt: string): string {
    return `${prompt}${GEMINI_AI_TRYON_PROMPT_STRICT_SUFFIX}`;
  }

  private async generateTryOnWithRetries(params: {
    avatarData: GeminiInlineData;
    clothingData: GeminiInlineData;
    originalClothingData: GeminiInlineData;
    prompt: string;
  }): Promise<string> {
    const { avatarData, clothingData, originalClothingData, prompt } = params;
    const maxAttempts = GEMINI_TRYON_OUTPUT_VALIDATION.OUTPUT_MATCH_RETRY_LIMIT;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const promptToUse =
        attempt === 0 ? prompt : this.buildStrictPrompt(prompt);
      const clothingToUse =
        attempt === 0 ? clothingData : originalClothingData;

      try {
        const imageBase64 = await this.generateTryOnWithModel(
          this.modelId,
          promptToUse,
          avatarData,
          clothingToUse,
        );

        this.assertOutputIsNotInput(imageBase64, [
          avatarData.data,
          originalClothingData.data,
          clothingData.data,
        ]);

        return imageBase64;
      } catch (error) {
        if (!this.isOutputMatchError(error)) {
          throw error;
        }
      }
    }

    throw new AIServiceException(
      TryOnErrorCode.PROCESSING_FAILED,
      GEMINI_TRYON_ERROR_MESSAGES.OUTPUT_NOT_GENERATED,
      500,
      { attempts: maxAttempts, model: this.modelId },
    );
  }

  private isOutputMatchError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message === GEMINI_TRYON_ERROR_MESSAGES.OUTPUT_MATCHES_INPUT;
    }
    return false;
  }


  private extractTryOnImage(
    response: GeminiResponse,
    avatarBase64: string,
    clothingBase64: string,
  ): string {
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

    const avatarHash = this.hashBase64(avatarBase64);
    const clothingHash = this.hashBase64(clothingBase64);

    const nonInputImages = _.filter(imageDataList, (data) => {
      const imageHash = this.hashBase64(data);
      return imageHash !== avatarHash && imageHash !== clothingHash;
    });

    if (!nonInputImages.length) {
      throw new Error(GEMINI_TRYON_ERROR_MESSAGES.OUTPUT_MATCHES_INPUT);
    }

    const [bestImage] = _.orderBy(nonInputImages, (data) => data.length, [
      'desc',
    ]);
    return bestImage || nonInputImages[0];
  }

  private hashBase64(base64Data: string): string {
    return createHash('sha256').update(base64Data).digest('hex');
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
    });

    const generationPromise = model.generateContent([
      {
        inlineData: {
          data: avatarData.data,
          mimeType: avatarData.mimeType,
        },
      },
      {
        inlineData: {
          data: clothingData.data,
          mimeType: clothingData.mimeType,
        },
      },
      { text: prompt },
    ]);

    const result = await this.withTimeout(generationPromise, GEMINI_AI_TIMEOUT);
    const response = (result as GeminiGenerateResult).response;

    const imageBase64 = this.extractTryOnImage(
      response,
      avatarData.data,
      clothingData.data,
    );

    await this.assertOutputLooksLikeTryOn(imageBase64);
    return imageBase64;
  }

  private async assertOutputLooksLikeTryOn(
    outputBase64: string,
  ): Promise<void> {
    try {
      const { default: sharp } = await import('sharp');
      const buffer = Buffer.from(outputBase64, 'base64');
      const metadata = await sharp(buffer).metadata();

      if (!metadata.width || !metadata.height) {
        return;
      }

      const ratio = metadata.width / metadata.height;
      if (ratio > GEMINI_TRYON_OUTPUT_VALIDATION.MAX_LANDSCAPE_RATIO) {
        throw new Error(GEMINI_TRYON_ERROR_MESSAGES.OUTPUT_MATCHES_INPUT);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === GEMINI_TRYON_ERROR_MESSAGES.OUTPUT_MATCHES_INPUT
      ) {
        throw error;
      }
    }
  }

  private assertOutputIsNotInput(
    outputBase64: string,
    comparisonImages: string[],
  ): void {
    const outputHash = this.hashBase64(outputBase64);
    const comparisonHashes = _.map(comparisonImages, (image) =>
      this.hashBase64(image),
    );

    if (_.some(comparisonHashes, (hash) => hash === outputHash)) {
      throw new Error(GEMINI_TRYON_ERROR_MESSAGES.OUTPUT_MATCHES_INPUT);
    }
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
      return maskOverride ? this.applyTopRegionBlur(clothingData) : clothingData;
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

}
