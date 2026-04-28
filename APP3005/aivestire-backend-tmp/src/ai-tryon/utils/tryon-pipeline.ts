import { Logger } from '@nestjs/common';
import { TryOnResponseDto } from '../dto/tryon-response.dto';
import { AIProvider, TryOnErrorCode, TryOnStatus } from '../enums/ai-provider.enum';
import { TryOnException, AIServiceException } from '../exceptions/tryon.exceptions';

export interface TryOnPipelineOptions {
  provider: AIProvider;
  avatarImage: string;
  clothingImage: string;
  additionalParams?: Record<string, any>;
  logger: Logger;

  validateImages: (avatarImage: string, clothingImage: string) => Promise<void>;
  preprocessImages: (
    avatarImage: string,
    clothingImage: string,
  ) => Promise<{ avatarBase64: string; clothingBase64: string }>;
  performTryOn: (
    avatarBase64: string,
    clothingBase64: string,
    additionalParams?: Record<string, any>,
  ) => Promise<string>;
  postprocessResult?: (resultImage: string) => Promise<string>;
}

export async function runTryOnPipeline(
  options: TryOnPipelineOptions,
): Promise<TryOnResponseDto> {
  const {
    provider,
    avatarImage,
    clothingImage,
    additionalParams,
    logger,
    validateImages,
    preprocessImages,
    performTryOn,
    postprocessResult,
  } = options;

  const startTime = Date.now();

  try {
    logger.log(`Starting try-on with ${provider}`);

    await validateImages(avatarImage, clothingImage);
    const { avatarBase64, clothingBase64 } = await preprocessImages(
      avatarImage,
      clothingImage,
    );

    const resultImage = await performTryOn(
      avatarBase64,
      clothingBase64,
      additionalParams,
    );

    const finalImage = postprocessResult
      ? await postprocessResult(resultImage)
      : resultImage;

    const processingTimeMs = Date.now() - startTime;

    logger.log(`Try-on completed successfully in ${processingTimeMs}ms`);

    return {
      success: true,
      resultImage: finalImage,
      provider,
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Try-on failed after ${processingTimeMs}ms: ${message}`);

    if (error instanceof TryOnException) {
      throw error;
    }

    throw new AIServiceException(
      TryOnErrorCode.PROCESSING_FAILED,
      `Try-on processing failed: ${message}`,
      500,
      { provider, processingTimeMs },
    );
  }
}
