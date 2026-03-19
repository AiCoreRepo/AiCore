import { Logger } from '@nestjs/common';
import { AIProvider, TryOnStatus } from '../../enums/ai-provider.enum';
import { TryOnResponseDto } from '../../dto/tryon-response.dto';
import { ImageValidatorService } from './image-validator.service';
import {
  AIServiceException,
  TryOnException,
  TimeoutException,
} from '../../exceptions/tryon.exceptions';
import { TryOnErrorCode } from '../../enums/ai-provider.enum';
import {
  MAX_RETRIES,
  RETRY_DELAY_MS,
  RETRY_BACKOFF_MULTIPLIER,
  DEFAULT_TIMEOUT,
} from '../../constants/tryon.constants';

/**
 * Abstract base class for all try-on services
 * Provides common functionality for validation, retry logic, and error handling
 */
export abstract class BaseTryOnService {
  protected readonly logger: Logger;

  constructor(
    protected readonly imageValidator: ImageValidatorService,
    protected readonly provider: AIProvider,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Main entry point for try-on processing
   */
  async processTryOn(
    avatarImage: string,
    clothingImage: string,
    additionalParams?: Record<string, any>,
  ): Promise<TryOnResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(`Starting try-on with ${this.provider}`);

      // Step 1: Validate images
      await this.validateImages(avatarImage, clothingImage);

      // Step 2: Preprocess images
      const { avatarBase64, clothingBase64 } = await this.preprocessImages(
        avatarImage,
        clothingImage,
      );

      // Step 3: Perform try-on with retry logic
      const resultImage = await this.performTryOnWithRetry(
        avatarBase64,
        clothingBase64,
        additionalParams,
      );

      // Step 4: Postprocess result
      const finalImage = await this.postprocessResult(resultImage);

      const processingTimeMs = Date.now() - startTime;

      this.logger.log(`Try-on completed successfully in ${processingTimeMs}ms`);

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
        `Try-on failed after ${processingTimeMs}ms: ${error.message}`,
      );

      if (error instanceof TryOnException) {
        throw error;
      }

      throw new AIServiceException(
        TryOnErrorCode.PROCESSING_FAILED,
        `Try-on processing failed: ${error.message}`,
        500,
        { provider: this.provider, processingTimeMs },
      );
    }
  }

  /**
   * Validate both avatar and clothing images
   */
  protected async validateImages(
    avatarImage: string,
    clothingImage: string,
  ): Promise<void> {
    this.logger.debug('Validating images...');

    // Validate avatar image
    const avatarValidation =
      await this.imageValidator.validateImage(avatarImage);
    if (!avatarValidation.valid) {
      throw new Error(
        `Avatar image validation failed: ${avatarValidation.error}`,
      );
    }

    // Validate clothing image
    const clothingValidation =
      await this.imageValidator.validateImage(clothingImage);
    if (!clothingValidation.valid) {
      throw new Error(
        `Clothing image validation failed: ${clothingValidation.error}`,
      );
    }

    this.logger.debug('Image validation passed');
  }

  /**
   * Preprocess images (convert URLs to base64, normalize format)
   */
  protected async preprocessImages(
    avatarImage: string,
    clothingImage: string,
  ): Promise<{ avatarBase64: string; clothingBase64: string }> {
    this.logger.debug('Preprocessing images...');

    // Convert URLs to base64 if needed
    const avatarBase64 = avatarImage.startsWith('http')
      ? await this.imageValidator.urlToBase64(avatarImage)
      : avatarImage;

    const clothingBase64 = clothingImage.startsWith('http')
      ? await this.imageValidator.urlToBase64(clothingImage)
      : clothingImage;

    return { avatarBase64, clothingBase64 };
  }

  /**
   * Perform try-on with retry logic
   */
  protected async performTryOnWithRetry(
    avatarBase64: string,
    clothingBase64: string,
    additionalParams?: Record<string, any>,
  ): Promise<string> {
    let lastError: Error | null = null;
    let delay = RETRY_DELAY_MS;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        this.logger.debug(`Try-on attempt ${attempt}/${MAX_RETRIES}`);

        const result = await this.performTryOn(
          avatarBase64,
          clothingBase64,
          additionalParams,
        );

        return result;
      } catch (error) {
        lastError = error;
        this.logger.warn(`Try-on attempt ${attempt} failed: ${error.message}`);

        // Retry timeouts and processing failures; other TryOnException types should not retry
        if (error instanceof TryOnException) {
          if (
            error.errorCode === TryOnErrorCode.TIMEOUT_ERROR ||
            error.errorCode === TryOnErrorCode.PROCESSING_FAILED
          ) {
            this.logger.warn(
              `Retrying after timeout (attempt ${attempt}/${MAX_RETRIES})`,
            );
          } else {
            throw error;
          }
        }

        // Wait before retrying (except on last attempt)
        if (attempt < MAX_RETRIES) {
          await this.sleep(delay);
          delay *= RETRY_BACKOFF_MULTIPLIER;
        }
      }
    }

    // All retries failed
    throw new AIServiceException(
      TryOnErrorCode.PROCESSING_FAILED,
      `Try-on failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
      500,
      { attempts: MAX_RETRIES, lastError: lastError?.message },
    );
  }

  /**
   * Postprocess the result image
   */
  protected async postprocessResult(resultImage: string): Promise<string> {
    // Default implementation: return as-is
    // Subclasses can override for custom postprocessing
    return resultImage;
  }

  /**
   * Sleep utility for retry delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute with timeout
   */
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = DEFAULT_TIMEOUT,
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(
          new TimeoutException(`Operation timed out after ${timeoutMs}ms`, {
            timeoutMs,
          }),
        );
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

  /**
   * Abstract method: Perform the actual try-on using AI service
   * Must be implemented by subclasses
   */
  protected abstract performTryOn(
    avatarBase64: string,
    clothingBase64: string,
    additionalParams?: Record<string, any>,
  ): Promise<string>;

  /**
   * Abstract method: Check if the service is configured and available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Abstract method: Get service configuration status
   */
  abstract getConfigurationStatus(): {
    configured: boolean;
    message?: string;
  };
}
