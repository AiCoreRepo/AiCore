import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { VertexTryOnService } from './providers/vertex-tryon.service';
import { GeminiTryOnService } from './providers/gemini-tryon.service';
import { CloudinaryService } from '../../common/cloudinary.service'; // Corrected path for CloudinaryService
import { Aura } from '@prisma/client';
import { TryOnResponseDto } from '../dto/tryon-response.dto';
import { AIProvider, TryOnStatus } from '../enums/ai-provider.enum';

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
        private readonly vertexService: VertexTryOnService,
        private readonly geminiService: GeminiTryOnService,
        private readonly configService: ConfigService,
        private readonly cloudinaryService: CloudinaryService, // Injected CloudinaryService
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
            throw new HttpException(
                'Clothing item not found',
                HttpStatus.NOT_FOUND,
            );
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
    ) {
        this.logger.log(`💾 Saving try-on result to database...`);
        this.logger.log(`💾 User: ${userId}, Product: ${productId}, Aura: ${auraId}`);

        // Upload image to Cloudinary
        let cloudinaryUrl: string;
        try {
            this.logger.log(`☁️ Uploading try-on image to Cloudinary...`);
            cloudinaryUrl = await this.cloudinaryService.uploadImage(resultImageUrl);
            this.logger.log(`✅ Image uploaded to Cloudinary: ${cloudinaryUrl}`);
        } catch (error) {
            this.logger.error(`Failed to upload to Cloudinary: ${error.message}`);
            // Fallback to base64 if Cloudinary upload fails
            cloudinaryUrl = resultImageUrl;
        }

        // Save try-on result with Cloudinary URL
        const tryOn = await this.prisma.tryOn.create({
            data: {
                user_id: userId,
                product_id: productId,
                aura_id: auraId,
                result_image_url: cloudinaryUrl,
                provider: provider,
            },
        });

        this.logger.log(` Try-on saved with ID: ${tryOn.try_on_id}`);

        // Increment user's try-on counter
        await this.prisma.user.update({
            where: { user_id: userId },
            data: { try_ons_used: { increment: 1 } },
        });

        return tryOn;
    }

    /**
     * 3D Try-On with Vertex AI (no background)
     */
    async tryOnWithVertex(
        aura: Aura,
        clothingItemId: string,
        additionalParams?: Record<string, any>,
    ): Promise<TryOnResponseDto> {
        this.logger.log(`🔵 VERTEX AI - Processing 3D try-on for user ${aura.user_id}`);
        this.logger.log(`🔵 VERTEX AI - Using Vertex AI for initial try-on (no background)`);

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

        // Merge with additional params
        const enhancedParams = {
            ...additionalParams,
            aura_attributes: auraAttributes,
        };

        // Call Vertex service with GENERATED AVATAR (model_url) instead of original image
        const result = await this.vertexService.processTryOn(
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
            'vertex',
        );

        this.logger.log(`✅ 3D Vertex try-on completed for user ${aura.user_id}`);

        return result;
    }

    /**
     * 3D Try-On with Gemini AI (with background)
     */
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

        // Merge with additional params
        const enhancedParams = {
            ...additionalParams,
            aura_attributes: auraAttributes,
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

    /**
     * Generate more angles from existing try-on image
     */
    async generateMoreAngles(
        aura: Aura,
        productId: string,
        previousImageUrl: string,
        additionalParams?: Record<string, any>,
    ): Promise<TryOnResponseDto> {
        this.logger.log(`🟢 GEMINI AI - Generating more angles for user ${aura.user_id}`);
        this.logger.log(`🟢 GEMINI AI - Using Gemini AI for angle generation`);

        try {
            // Extract base64 data from previous image
            const extractBase64Data = (base64String: string): string => {
                if (base64String.startsWith('data:')) {
                    const matches = base64String.match(/^data:[^;]+;base64,(.+)$/);
                    return matches ? matches[1] : base64String;
                }
                return base64String;
            };

            const previousImageData = extractBase64Data(previousImageUrl);

            // Call FastAPI Gemini angles endpoint directly
            this.logger.log('🔄 Calling FastAPI Gemini angles service...');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const response = await fetch(this.geminiAnglesUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    previous_image: previousImageData,
                    additional_params: additionalParams,
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

            this.logger.log('✅ More angles generated successfully');

            // Upload angle-generated image to Cloudinary and save to database
            try {
                this.logger.log(`☁️ Uploading angle-generated image to Cloudinary...`);
                const cloudinaryUrl = await this.cloudinaryService.uploadImage(resultImage);
                this.logger.log(`✅ Angle image uploaded to Cloudinary: ${cloudinaryUrl}`);

                const savedTryOn = await this.prisma.tryOn.create({
                    data: {
                        user_id: aura.user_id,
                        aura_id: aura.aura_id,
                        product_id: productId,
                        result_image_url: cloudinaryUrl,
                        provider: 'gemini', // angle generation is always Gemini in this implementation
                    },
                });
                this.logger.log(`💾 Saved angle-generated image to database: ${savedTryOn.try_on_id}`);
            } catch (error) {
                this.logger.error(`Failed to save angle-generated image: ${error.message}`);
                // Don't fail the request if save fails
            }

            return {
                success: true,
                status: TryOnStatus.SUCCESS,
                provider: AIProvider.GEMINI_AI,
                resultImage: resultImage,
                processingTimeMs: result.processing_time || 0,
                timestamp: new Date().toISOString(),
                metadata: result.metadata,
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

            this.logger.log(`📸 Found ${tryOns.length} try-ons in database for user ${userId}`);

            if (tryOns.length > 0) {
                this.logger.log(`📸 First try-on: ${tryOns[0].try_on_id}, Product: ${tryOns[0].product.title}`);
            }

            return {
                success: true,
                tryOns: tryOns.map(tryOn => ({
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
