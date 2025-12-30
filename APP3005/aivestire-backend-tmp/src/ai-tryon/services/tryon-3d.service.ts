import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { VertexTryOnService } from './providers/vertex-tryon.service';
import { GeminiTryOnService } from './providers/gemini-tryon.service';
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
    ) {
        // Save try-on result
        const tryOn = await this.prisma.tryOn.create({
            data: {
                user_id: userId,
                product_id: productId,
                aura_id: auraId,
                result_image_url: resultImageUrl,
            },
        });

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
        this.logger.log(`Processing 3D Vertex try-on for user ${aura.user_id}`);

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

        // Call Vertex service
        const result = await this.vertexService.processTryOn(
            aura.image_url!,
            clothingImageUrl,
            enhancedParams,
        );

        // Save result to database
        await this.saveTryOnResult(
            aura.user_id,
            clothingItemId,
            aura.aura_id,
            result.resultImage,
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
        this.logger.log(`Processing 3D Gemini try-on for user ${aura.user_id}`);

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

        // Call Gemini service
        const result = await this.geminiService.processTryOn(
            aura.image_url!,
            clothingImageUrl,
            enhancedParams,
        );

        // Save result to database
        await this.saveTryOnResult(
            aura.user_id,
            clothingItemId,
            aura.aura_id,
            result.resultImage,
        );

        this.logger.log(`✅ 3D Gemini try-on completed for user ${aura.user_id}`);

        return result;
    }

    /**
     * Generate more angles from existing try-on image
     */
    async generateMoreAngles(
        aura: Aura,
        previousImageUrl: string,
        additionalParams?: Record<string, any>,
    ): Promise<TryOnResponseDto> {
        this.logger.log(`Generating more angles for user ${aura.user_id}`);

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

            // Note: We don't save angle generation results to database
            // as they don't have a specific product_id associated
            // You can modify this if you want to track angle generations

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
}
