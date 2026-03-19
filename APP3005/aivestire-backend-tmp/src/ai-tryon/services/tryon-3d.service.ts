import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { DirectVertexTryOnService } from './providers/direct-vertex-tryon.service';
import {
  CloudinaryService,
  CloudinaryMetadata,
} from '../../common/cloudinary.service';
import { ImageOptimizerService } from '../../common/image-optimizer.service';
import { Aura } from '@prisma/client';
import { TryOnResponseDto } from '../dto/tryon-response.dto';
import { AIProvider, TryOnStatus } from '../enums/ai-provider.enum';
import { GEMINI_AI_TIMEOUT } from '../constants/tryon.constants';

/**
 * 3D Virtual Try-On Service
 * Handles 3D try-on operations with Aura validation and database integration
 */
@Injectable()
export class TryOn3DService {
  private readonly logger = new Logger(TryOn3DService.name);
  private readonly geminiAnglesUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly directVertexService: DirectVertexTryOnService,

    private readonly configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly imageOptimizer: ImageOptimizerService,
  ) {
    // Get Gemini angles endpoint from environment
    this.geminiAnglesUrl =
      this.configService.get<string>('FASTAPI_GEMINI_ANGLES_URL') ||
      'http://localhost:8000/gemini/generate-angles';
  }

  /**
   * Fetch clothing item from database
   */
  private async getClothingItem(clothingItemId: string) {
    const product = await this.prisma.product.findUnique({
      where: { product_id: clothingItemId },
      include: {
        images: {
          where: { is_primary: true },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new HttpException('Clothing item not found', HttpStatus.NOT_FOUND);
    }

    // If no primary image, get the first image
    if (product.images.length === 0) {
      const firstImage = await this.prisma.productImage.findFirst({
        where: { product_id: clothingItemId },
        orderBy: { order_index: 'asc' },
      });

      if (!firstImage) {
        throw new HttpException(
          'Clothing item has no images',
          HttpStatus.NOT_FOUND,
        );
      }

      return { product, imageUrl: firstImage.url };
    }

    return { product, imageUrl: product.images[0].url };
  }

  /**
   * Save try-on result to database
   */
  private async saveTryOnResult(
    userId: string,
    productId: string,
    auraId: string,
    resultImageUrl: string,
    provider: string = 'unknown',
    angle?: string,
  ) {
    const startTime = Date.now();
    this.logger.log(`💾 Saving try-on result to database...`);
    this.logger.log(
      `💾 User: ${userId}, Product: ${productId}, Aura: ${auraId}`,
    );

    try {
      // Extract image metadata for caching
      this.logger.log(`📊 Extracting image metadata...`);
      const imageMetadata =
        await this.imageOptimizer.extractImageMetadata(resultImageUrl);
      const dominantColors = await this.imageOptimizer.extractDominantColors(
        resultImageUrl,
        3,
      );

      // Compress image if needed
      let imageToUpload = resultImageUrl;
      if (this.imageOptimizer.shouldCompress(resultImageUrl, 2048)) {
        this.logger.log(`🔄 Compressing large image before upload...`);
        imageToUpload = await this.imageOptimizer.compressImage(
          resultImageUrl,
          {
            quality: 85,
            maxWidth: 2048,
            maxHeight: 2048,
          },
        );
      }

      // Upload to Cloudinary with metadata
      this.logger.log(
        `☁️ Uploading try-on image to Cloudinary with metadata...`,
      );
      const cloudinaryMetadata: CloudinaryMetadata = {
        userId,
        productId,
        auraId,
        dominantColors,
        imageType: angle ? 'angle' : 'try-on',
        angle,
        processingTime: Date.now() - startTime,
      };

      const uploadResult = await this.cloudinaryService.uploadWithMetadata(
        imageToUpload,
        cloudinaryMetadata,
        'try-ons',
      );

      // Create thumbnail for faster angle generation
      const thumbnailUrl = this.cloudinaryService.getThumbnailUrl(
        uploadResult.publicId,
        512,
      );
      const compressedUrl = this.cloudinaryService.getCompressedUrl(
        uploadResult.publicId,
        75,
      );

      this.logger.log(
        `✅ Image uploaded to Cloudinary: ${uploadResult.secureUrl}`,
      );
      this.logger.log(`✅ Thumbnail URL: ${thumbnailUrl}`);

      // Save try-on result with caching metadata
      const tryOn = await this.prisma.tryOn.create({
        data: {
          user_id: userId,
          product_id: productId,
          aura_id: auraId,
          result_image_url: uploadResult.secureUrl,
          provider: provider,
          angle: angle,
          cloudinary_public_id: uploadResult.publicId,
          thumbnail_url: thumbnailUrl,
          compressed_url: compressedUrl,
          metadata_cache: {
            width: imageMetadata.width,
            height: imageMetadata.height,
            format: imageMetadata.format,
            dominantColors,
            uploadedAt: new Date().toISOString(),
          },
          processing_metrics: {
            uploadTime: Date.now() - startTime,
            originalSize: imageMetadata.size,
            compressedSize: uploadResult.bytes,
            compressionRatio: (
              (1 - uploadResult.bytes / imageMetadata.size) *
              100
            ).toFixed(2),
          },
        },
      });

      this.logger.log(`✅ Try-on saved with ID: ${tryOn.try_on_id}`);

      // Increment user's try-on counter
      await this.prisma.user.update({
        where: { user_id: userId },
        data: { try_ons_used: { increment: 1 } },
      });

      return tryOn;
    } catch (error) {
      this.logger.error(`Failed to save try-on result: ${error.message}`);
      // Fallback: save without caching metadata
      const tryOn = await this.prisma.tryOn.create({
        data: {
          user_id: userId,
          product_id: productId,
          aura_id: auraId,
          result_image_url: resultImageUrl,
          provider: provider,
          angle: angle,
        },
      });

      await this.prisma.user.update({
        where: { user_id: userId },
        data: { try_ons_used: { increment: 1 } },
      });

      return tryOn;
    }
  }

  /**
   * 3D Try-On with Vertex AI (no background)
   */
  async tryOnWithVertex(
    aura: Aura,
    clothingItemId: string,
    additionalParams?: Record<string, any>,
  ): Promise<TryOnResponseDto> {
    this.logger.log(
      `🔵 VERTEX AI - Processing 3D try-on for user ${aura.user_id}`,
    );
    this.logger.log(
      `🔵 VERTEX AI - Using Vertex AI for initial try-on (no background)`,
    );

    const tryOnAvatarUrl = aura.model_url;

    /*
    const tryOnAvatarUrl = aura.tryon_model_url || aura.model_url;
    */

    // Validate that avatar has been generated
    if (!tryOnAvatarUrl) {
      throw new HttpException(
        'Avatar has not been generated yet. Please wait for avatar generation to complete.',
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(`✅ Using direct avatar for try-on: ${tryOnAvatarUrl}`);

    // Get clothing item
    const { product, imageUrl: clothingImageUrl } =
      await this.getClothingItem(clothingItemId);
    this.logger.log(`✅ Clothing item fetched: ${product.title}`);

    // Prepare Aura attributes for AI prompt enhancement
    const auraAttributes = {
      height_cm: aura.height_cm,
      weight_kg: aura.weight_kg,
      skin_tone: aura.skin_tone,
      gender: aura.gender,
      body_shape: aura.body_shape,
      age_range: aura.age_range,
      hair_style: aura.hair_style,
      beard: aura.beard,
      ...(aura.extra_attributes && typeof aura.extra_attributes === 'object'
        ? aura.extra_attributes
        : {}),
    };

    // Merge with additional params
    const enhancedParams = {
      ...additionalParams,
      aura_attributes: auraAttributes,
    };

    const result = await this.directVertexService.processTryOn(
      tryOnAvatarUrl,
      clothingImageUrl,
      enhancedParams,
    );

    const vertexReturnedAvatar = await this.imageOptimizer.areImagesVisuallySimilar(
      result.resultImage,
      tryOnAvatarUrl,
    );

    if (vertexReturnedAvatar) {
      throw new HttpException(
        'Initial try-on did not apply the outfit. The generated image matched the avatar too closely.',
        HttpStatus.BAD_GATEWAY,
      );
    }

    // Save result to database
    const tryOn = await this.saveTryOnResult(
      aura.user_id,
      clothingItemId,
      aura.aura_id,
      result.resultImage,
      'vertex',
    );

    this.logger.log(`✅ 3D Vertex try-on completed for user ${aura.user_id}`);

    return {
      ...result,
      tryOnId: tryOn.try_on_id,
    };
  }

  /**
   * 3D Try-On with Gemini AI (with background)
   * @deprecated - Try on is done only by vertex
   */
  /*
    async tryOnWithGemini(
        aura: Aura,
        clothingItemId: string,
        additionalParams?: Record<string, any>,
    ): Promise<TryOnResponseDto> {
        this.logger.log(`🟢 GEMINI AI - Processing 3D try-on for user ${aura.user_id}`);
        this.logger.log(`🟢 GEMINI AI - Using Gemini AI for try-on with background`);

        // Validate that avatar has been generated
        if (!aura.model_url) {
            throw new HttpException(
                'Avatar has not been generated yet. Please wait for avatar generation to complete.',
                HttpStatus.BAD_REQUEST,
            );
        }

        this.logger.log(`✅ Using generated avatar: ${aura.model_url}`);

        // Get clothing item
        const { product, imageUrl: clothingImageUrl } = await this.getClothingItem(clothingItemId);
        this.logger.log(`✅ Clothing item fetched: ${product.title}`);

        // Prepare Aura attributes for AI prompt enhancement
        const auraAttributes = {
            height_cm: aura.height_cm,
            weight_kg: aura.weight_kg,
            skin_tone: aura.skin_tone,
            gender: aura.gender,
            body_shape: aura.body_shape,
            age_range: aura.age_range,
            hair_style: aura.hair_style,
            beard: aura.beard,
            ...(aura.extra_attributes && typeof aura.extra_attributes === 'object' ? aura.extra_attributes : {}),
        };

        // Merge with additional params and add user/product IDs for session tracking
        const enhancedParams = {
            ...additionalParams,
            aura_attributes: auraAttributes,
            user_id: aura.user_id,  // For angle session tracking
            product_id: clothingItemId,  // For angle session tracking
        };

        // Call Gemini service with GENERATED AVATAR (model_url) instead of original image
        const result = await this.geminiService.processTryOn(
            aura.model_url!,
            clothingImageUrl,
            enhancedParams,
        );

        // Save result to database
        await this.saveTryOnResult(
            aura.user_id,
            clothingItemId,
            aura.aura_id,
            result.resultImage,
            'gemini',
        );

        this.logger.log(`✅ 3D Gemini try-on completed for user ${aura.user_id}`);

        return result;
    }
    */

  /**
   * Helper to ensure we have base64 data
   * Downloads image if it's a URL
   */
  private async ensureBase64(input: string): Promise<string> {
    // Extract base64 result
    const extractBase64Data = (base64String: string): string => {
      if (base64String.startsWith('data:')) {
        const matches = base64String.match(/^data:[^;]+;base64,(.+)$/);
        return matches ? matches[1] : base64String;
      }
      return base64String;
    };

    // If it's already base64, return it (cleaned)
    if (input.startsWith('data:') || input.length > 500) {
      return extractBase64Data(input);
    }

    // It looks like a URL
    if (input.startsWith('http')) {
      this.logger.log(`⬇️ Downloading image from URL for full resolution...`);
      try {
        const response = await fetch(input);
        if (!response.ok)
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer).toString('base64');
      } catch (error) {
        this.logger.error(`Failed to download image: ${error.message}`);
        // Fallback to original input if download fails
        return extractBase64Data(input);
      }
    }

    return input;
  }

  /**
   * @deprecated This method is deprecated. Angle generation has been moved to DifferentAnglesGenModule.
   * Use the new endpoint: POST /api/angles/generate
   *
   * This code is kept intact for reference but is no longer used.
   * The new implementation provides:
   * - Direct Gemini AI integration (no FastAPI dependency)
   * - Better session management per user+product
   * - Improved prompt engineering
   * - Same caching and optimization features
   *
   * Generate more angles from existing try-on image
   * Uses cached metadata and thumbnails to reduce token consumption
   */
  /*
    async generateMoreAngles(
        aura: Aura,
        productId: string,
        previousImageUrl: string,
        additionalParams: any,
    ): Promise<TryOnResponseDto> {
        const startTime = Date.now();

        this.logger.log(`🟢 GEMINI AI - Generating more angles for user ${aura.user_id}`);
        this.logger.log(`🟢 GEMINI AI - Using optimized caching strategy`);
        try {
            // Try to get cached metadata from database
            let cachedMetadata: any = null;
            let thumbnailToUse = previousImageUrl;
            let cloudinaryPublicId: string | null = null;

            // Check if previous image is from Cloudinary
            if (previousImageUrl.includes('cloudinary.com')) {
                cloudinaryPublicId = this.cloudinaryService.extractPublicId(previousImageUrl);

                if (cloudinaryPublicId) {
                    this.logger.log(`📦 Found Cloudinary image, extracting cached data...`);

                    // Get cached metadata from database
                    const existingTryOn = await this.prisma.tryOn.findFirst({
                        where: { cloudinary_public_id: cloudinaryPublicId },
                        orderBy: { created_at: 'desc' },
                    });

                    if (existingTryOn?.metadata_cache) {
                        cachedMetadata = existingTryOn.metadata_cache;
                        this.logger.log(`✅ Using cached metadata from database`);
                    }

                    // Use thumbnail URL instead of full image (massive token reduction)
                    if (existingTryOn?.thumbnail_url) {
                        thumbnailToUse = existingTryOn.thumbnail_url;
                        this.logger.log(`✅ Using thumbnail URL for faster processing`);
                    } else {
                        // Generate thumbnail URL on-the-fly
                        thumbnailToUse = this.cloudinaryService.getThumbnailUrl(cloudinaryPublicId, 512);
                        this.logger.log(`✅ Generated thumbnail URL from Cloudinary`);
                    }
                }
            }

            // If no cached data, extract from image
            if (!cachedMetadata) {
                this.logger.log(`📊 No cached metadata found, extracting from image...`);
                const imageMetadata = await this.imageOptimizer.extractImageMetadata(previousImageUrl);
                const dominantColors = await this.imageOptimizer.extractDominantColors(previousImageUrl, 3);

                cachedMetadata = {
                    width: imageMetadata.width,
                    height: imageMetadata.height,
                    dominantColors,
                };

                // Create thumbnail for processing
                thumbnailToUse = await this.imageOptimizer.createThumbnail(previousImageUrl, 512);
            }

            // Ensure we have the full base64 data (download if it's a URL)
            // Use FULL RESOLUTION image for better quality and facial feature preservation
            const fullImageData = await this.ensureBase64(previousImageUrl);
            const fullImageSizeKB = Math.round(fullImageData.length / 1024);

            this.logger.log(`📦 Using FULL RESOLUTION try-on result for angle generation: ${fullImageSizeKB} KB`);
            this.logger.log(`   ✅ This image already has the correct face + clothes combined`);

            // Call FastAPI Gemini angles endpoint with the try-on result
            // SIMPLIFIED APPROACH: Just use the try-on result image (which already has correct face + clothes)
            // No need to send separate clothing image - it was causing mannequin face to be copied
            this.logger.log(`🔄 Calling FastAPI Gemini angles service at ${this.geminiAnglesUrl}...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), GEMINI_AI_TIMEOUT);

            const response = await fetch(this.geminiAnglesUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    previous_image: fullImageData, // The try-on result with correct face + clothes
                    // NO reference_image needed - the previous_image IS the reference
                    // NO clothing_image needed - clothes are already in the try-on result
                    additional_params: {
                        ...additionalParams,
                        cached_metadata: cachedMetadata,
                        use_full_resolution: true,
                        user_id: aura.user_id,
                        product_id: productId,
                    },
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new HttpException(
                    `FastAPI angle generation failed: ${errorData.message || 'Unknown error'}`,
                    response.status,
                );
            }

            const result = await response.json();

            if (!result.success || !result.result_image) {
                throw new HttpException(
                    result.message || 'FastAPI service did not return a valid result',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            // Add data URI prefix if not present
            const resultImage = result.result_image.startsWith('data:')
                ? result.result_image
                : `data:image/jpeg;base64,${result.result_image}`;

            this.logger.log('✅ More angles generated successfully with optimized caching');

            // Upload angle-generated image to Cloudinary and save to database
            const angle = additionalParams?.angle || 'unknown';
            try {
                await this.saveTryOnResult(
                    aura.user_id,
                    productId,
                    aura.aura_id,
                    resultImage,
                    'gemini',
                    angle,
                );
            } catch (error) {
                // Don't fail the request if save fails
            }

            // Return angle generation result
            const processingTime = Date.now() - startTime;
            return {
                success: true,
                status: TryOnStatus.SUCCESS,
                provider: AIProvider.GEMINI_AI,
                resultImage: resultImage,
                processingTimeMs: result.processing_time || 0,
                timestamp: new Date().toISOString(),
                metadata: {
                    ...result.metadata,
                    cachingUsed: !!cachedMetadata,
                    fullResolutionUsed: true,
                    imageSizeKB: fullImageSizeKB,
                },
            };

        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new HttpException(
                    'Angle generation request timed out',
                    HttpStatus.GATEWAY_TIMEOUT,
                );
            }

            if (error instanceof HttpException) {
                throw error;
            }

            this.logger.error(`Angle generation error: ${error.message}`);
            throw new HttpException(
                `Failed to generate more angles: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
    */

  /**
   * Get user's try-on history
   */
  async getTryOnHistory(userId: string) {
    try {
      this.logger.log(`📸 Fetching try-on history for user: ${userId}`);
      this.logger.log(`📸 Query filter: { user_id: "${userId}" }`);

      const tryOns = await this.prisma.tryOn.findMany({
        where: { user_id: userId },
        include: {
          product: {
            select: {
              product_id: true,
              title: true,
              images: {
                where: { is_primary: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 50, // Limit to last 50 try-ons
      });

      this.logger.log(
        `📸 Found ${tryOns.length} try-ons in database for user ${userId}`,
      );

      if (tryOns.length > 0) {
        this.logger.log(
          `📸 First try-on: ${tryOns[0].try_on_id}, Product: ${tryOns[0].product.title}`,
        );
      }

      return {
        success: true,
        tryOns: tryOns.map((tryOn) => ({
          tryOnId: tryOn.try_on_id,
          productId: tryOn.product_id,
          productTitle: tryOn.product.title,
          productImage: tryOn.product.images[0]?.url || null,
          resultImage: tryOn.result_image_url,
          provider: tryOn.provider,
          createdAt: tryOn.created_at,
        })),
        count: tryOns.length,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch try-on history: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw new HttpException(
        'Failed to fetch try-on history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
