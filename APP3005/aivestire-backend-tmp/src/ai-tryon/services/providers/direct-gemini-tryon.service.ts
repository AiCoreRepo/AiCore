import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import _ from 'lodash';
import { ImageOptimizerService } from '../../../common/image-optimizer.service';
import { AIProvider, TryOnErrorCode } from '../../enums/ai-provider.enum';
import {
  AIServiceException,
  ConfigurationException,
  TimeoutException,
} from '../../exceptions/tryon.exceptions';
import { TryOnException } from '../../exceptions/tryon.exceptions';
import {
  buildGeminiTryOnPrompt,
  CONFIG_KEYS,
  ERROR_MESSAGES,
  GEMINI_AI_TIMEOUT,
  GEMINI_AI_TOTAL_BUDGET,
  GEMINI_AI_TRYON_PROMPT_STRICT_SUFFIX,
  GEMINI_TRYON_CONFIG,
  GEMINI_CLOTHING_MODEL_MASK,
  GEMINI_TRYON_OUTPUT_VALIDATION,
  GEMINI_TRYON_ERROR_MESSAGES,
  MAX_RETRIES,
  RETRY_BACKOFF_MULTIPLIER,
  RETRY_DELAY_MS,
} from '../../constants/tryon.constants';
import {
  buildDataUri,
  extractImageData,
  GeminiInlineData,
} from './direct-gemini-tryon-image-utils';
import { validateImage } from '../../utils/image-validator';
import { runTryOnPipeline } from '../../utils/tryon-pipeline';

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
export class DirectGeminiTryOnService {
  private readonly logger = new Logger(DirectGeminiTryOnService.name);
  private readonly apiKey: string;
  private readonly modelId: string;
  private readonly genAI: GoogleGenerativeAI | null;
  private readonly timingLogsEnabled: boolean;
  private readonly geminiTimeoutMs: number;
  private readonly geminiTotalBudgetMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly imageOptimizer: ImageOptimizerService,
  ) {
    this.apiKey =
      this.configService.get<string>(CONFIG_KEYS.GEMINI_API_KEY) || '';
    this.modelId = this.resolveConfiguredModelId(
      this.configService.get<string>(CONFIG_KEYS.GEMINI_MODEL),
    );
    this.timingLogsEnabled =
      String(this.configService.get<string>('AI_TIMING_LOGS') || '').toLowerCase() ===
      'true';
    this.geminiTimeoutMs = GEMINI_AI_TIMEOUT;
    this.geminiTotalBudgetMs = GEMINI_AI_TOTAL_BUDGET;

    this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;

    if (this.isConfigured()) {
      this.logger.log('✅ Direct Gemini AI service configured');
      this.logger.log(`   Model: ${this.modelId}`);
      this.logger.log(
        `   Timeout: ${this.geminiTimeoutMs}ms per attempt, ${this.geminiTotalBudgetMs}ms total budget`,
      );
    } else {
      this.logger.warn('⚠️ Direct Gemini AI service not fully configured');
    }
  }

  /**
   * Main entry point used by API controller and worker.
   */
  async processTryOn(
    avatarImage: string,
    clothingImage: string,
    additionalParams?: Record<string, any>,
  ) {
    return runTryOnPipeline({
      provider: AIProvider.GEMINI_AI,
      avatarImage,
      clothingImage,
      additionalParams,
      logger: this.logger,
      validateImages: async (avatar, clothing) => {
        await validateImage(avatar);
        await validateImage(clothing);
      },
      preprocessImages: async (avatar, clothing) => {
        // 1. Resolve URLs to base64 Data URIs using native extract tool (handles http vs base64 cases securely)
        const avatarRaw = await extractImageData(avatar);
        const clothingRaw = await extractImageData(clothing);
        
        const avatarDataUri = buildDataUri(avatarRaw.data, avatarRaw.mimeType);
        const clothingDataUri = buildDataUri(clothingRaw.data, clothingRaw.mimeType);

        // 2. Compress images to a maximum dimension of 1024px before sending them to Gemini.
        // Extremely high-resolution or complex clothing masks are the strict root cause of 
        // Gemini generation timeouts. Normalizing resolution guarantees fast first-time success.
        // We use PNG format to preserve native transparency (avoiding iOS transparent images turning into black boxes)
        const optimizedAvatar = await this.imageOptimizer.compressImage(avatarDataUri, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 85,
          format: 'png',
        });

        const optimizedClothing = await this.imageOptimizer.compressImage(clothingDataUri, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 85,
          format: 'png',
        });

        return {
          avatarBase64: optimizedAvatar,
          clothingBase64: optimizedClothing,
        };
      },
      performTryOn: (avatarBase64, clothingBase64, params) =>
        this.performTryOn(avatarBase64, clothingBase64, params),
      postprocessResult: (result) => this.postprocessResult(result),
    });
  }

  /**
   * Perform virtual try-on by calling Gemini AI directly
   */
  private async performTryOn(
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
      const primaryImage = await this.generateValidatedTryOnImage(
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

      this.logger.error(`Gemini request failed: ${error}`, error instanceof Error ? error.stack : undefined);
      if (error instanceof Error && (error as any).status) {
         this.logger.error(`Status: ${(error as any).status}`);
      }

      if (error instanceof TimeoutException) {
        throw new AIServiceException(
          TryOnErrorCode.TIMEOUT_ERROR,
          GEMINI_TRYON_ERROR_MESSAGES.REQUEST_TIMEOUT,
          504,
          {
            timeout: this.geminiTimeoutMs,
            totalBudget: this.geminiTotalBudgetMs,
          },
        );
      }

      if (error instanceof AIServiceException) {
        throw error;
      }

      // Preserve the specific Gemini API error string if possible
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : GEMINI_TRYON_ERROR_MESSAGES.REQUEST_FAILED;

      throw new AIServiceException(
        TryOnErrorCode.AI_SERVICE_ERROR,
        errorMessage, 
        500,
        { error: errorMessage },
      );
    }
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

  private resolveConfiguredModelId(configuredModel?: string): string {
    const trimmedModel = configuredModel?.trim();
    if (!trimmedModel) {
      return GEMINI_TRYON_CONFIG.DEFAULT_MODEL;
    }

    const normalizedModel = trimmedModel.toLowerCase();
    if (!normalizedModel.includes('image-preview')) {
      this.logger.warn(
        `⚠️ Unsupported Gemini try-on model override "${trimmedModel}". Falling back to ${GEMINI_TRYON_CONFIG.DEFAULT_MODEL}`,
      );
      return GEMINI_TRYON_CONFIG.DEFAULT_MODEL;
    }

    return trimmedModel;
  }

  private async postprocessResult(resultImage: string): Promise<string> {
    return this.imageOptimizer.normalizeToPortraitCanvas(resultImage, {
      targetAspectRatio: 2 / 3,
      maxWidth: 1200,
      maxHeight: 1800,
      quality: 90,
      format: 'jpeg',
      backgroundStyle: 'solid',
      backgroundColor: { r: 255, g: 255, b: 255, alpha: 1 },
    });
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new TimeoutException(`Operation timed out after ${timeoutMs}ms`, { timeoutMs }));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
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

  private buildRetryPrompt(prompt: string, attempt: number): string {
    if (attempt <= 1) {
      return prompt;
    }

    return [
      prompt,
      '',
      `RETRY ${attempt} INSTRUCTION:`,
      '- The previous attempt was invalid because it matched an input image.',
      '- Generate a brand-new try-on image.',
      '- Replace the original outfit from image 1 with the garment from image 2.',
      '- Do not return either input image, even with tiny edits.',
    ].join('\n');
  }

  private async identifyMatchedInput(
    outputImage: string,
    avatarImage: string,
    clothingImage: string,
  ): Promise<'avatar' | 'clothing' | null> {
    const threshold = GEMINI_TRYON_OUTPUT_VALIDATION.MAX_AVATAR_SIMILARITY;

    if (
      await this.imageOptimizer.areImagesVisuallySimilar(
        outputImage,
        avatarImage,
        threshold,
      )
    ) {
      return 'avatar';
    }

    if (
      await this.imageOptimizer.areImagesVisuallySimilar(
        outputImage,
        clothingImage,
        threshold,
      )
    ) {
      return 'clothing';
    }

    return null;
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

  private async generateValidatedTryOnImage(
    modelId: string,
    prompt: string,
    avatarData: GeminiInlineData,
    clothingData: GeminiInlineData,
  ): Promise<string> {
    const avatarDataUri = buildDataUri(avatarData.data, avatarData.mimeType);
    const clothingDataUri = buildDataUri(clothingData.data, clothingData.mimeType);
    let delayMs = RETRY_DELAY_MS;
    let lastMatchedInput: 'avatar' | 'clothing' | null = null;
    const generationDeadline = Date.now() + this.geminiTotalBudgetMs;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      const remainingBudgetMs = generationDeadline - Date.now();
      if (remainingBudgetMs <= 0) {
        throw new TimeoutException(
          `Gemini try-on total processing exceeded ${this.geminiTotalBudgetMs}ms`,
          { totalBudgetMs: this.geminiTotalBudgetMs, attempt },
        );
      }

      const attemptPrompt = this.buildRetryPrompt(prompt, attempt);
      const attemptTimeoutMs = Math.min(this.geminiTimeoutMs, remainingBudgetMs);
      const outputBase64 = await this.generateTryOnWithModel(
        modelId,
        attemptPrompt,
        avatarData,
        clothingData,
        attemptTimeoutMs,
      );
      const outputDataUri = buildDataUri(
        outputBase64,
        GEMINI_TRYON_CONFIG.DEFAULT_MIME_TYPE,
      );

      const matchedInput = await this.identifyMatchedInput(
        outputDataUri,
        avatarDataUri,
        clothingDataUri,
      );

      if (!matchedInput) {
        return outputBase64;
      }

      lastMatchedInput = matchedInput;
      this.logger.warn(
        `Gemini try-on attempt ${attempt} matched the ${matchedInput} input image. Retrying...`,
      );

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= RETRY_BACKOFF_MULTIPLIER;
      }
    }

    throw new AIServiceException(
      TryOnErrorCode.PROCESSING_FAILED,
      GEMINI_TRYON_ERROR_MESSAGES.OUTPUT_NOT_GENERATED,
      500,
      {
        attempts: MAX_RETRIES,
        reason: GEMINI_TRYON_ERROR_MESSAGES.OUTPUT_MATCH_RETRY_FAILED,
        matchedInput: lastMatchedInput,
      },
    );
  }

  private async generateTryOnWithModel(
    modelId: string,
    prompt: string,
    avatarData: GeminiInlineData,
    clothingData: GeminiInlineData,
    timeoutMs: number,
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
        responseModalities: ['IMAGE'],
      } as any,
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

    const result = await this.withTimeout(generationPromise, timeoutMs);
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
