import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import type { Aura } from '@prisma/client';
import { GetRecommendationsDto } from './dto/recommendation-request.dto';
import { RecommendationsResponseDto } from './dto/recommendation-response.dto';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly fastApiUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.fastApiUrl =
      this.configService.get<string>('FASTAPI_RECOMMENDATION_URL') ||
      'http://localhost:8000/recommendation/ai-decide';
  }

  /**
   * Get Aura for a user
   */
  async getAuraForUser(userId: string) {
    try {
      const aura = await this.prisma.aura.findUnique({
        where: { user_id: userId },
      });
      return aura;
    } catch (error) {
      this.logger.error(
        `Failed to fetch Aura for user ${userId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Get AI-powered outfit recommendations using FastAPI ML model
   */
  async getRecommendations(
    userId: string,
    aura: Aura,
    dto: GetRecommendationsDto,
  ): Promise<RecommendationsResponseDto> {
    try {
      this.logger.log(
        `Getting ML recommendations for user ${userId}, occasion: ${dto.occasion}`,
      );

      // Validate Aura has required image
      if (!aura.image_url) {
        throw new HttpException(
          'Aura image is required for AI recommendations. Please update your Aura with a photo.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Download and convert Aura image to base64
      this.logger.log(`📥 Downloading Aura image: ${aura.image_url}`);
      const imageBase64 = await this.downloadImageAsBase64(aura.image_url);

      // Extract age from Aura age_range (e.g., "26-35" -> 30)
      const age = this.extractAgeFromAura(aura);

      // Extract size from Aura (default to M if not available)
      const size = this.extractSizeFromAura(aura) || 'M';

      // Prepare request for FastAPI ML model
      const mlRequest = {
        image_base64: imageBase64,
        age: age,
        size: size,
        body_shape: aura.body_shape || 'Rectangle',
        skin_tone: aura.skin_tone || 'Medium',
        occasion: dto.occasion,
        top_k: dto.top_k || 12,
        apply_priority_filter: true,
        apply_priority_weight: true,
      };

      this.logger.log(
        `🤖 Calling ML model with: occasion=${dto.occasion}, age=${age}, body_shape=${aura.body_shape}, skin_tone=${aura.skin_tone}`,
      );

      // Call FastAPI ML recommendation service
      const response = await firstValueFrom(
        this.httpService.post(this.fastApiUrl, mlRequest, {
          timeout: 60000, // 60 second timeout for ML inference
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      const mlResponse = response.data;

      this.logger.log(
        `✅ ML model returned ${mlResponse.count} recommendations`,
      );
      if (mlResponse.warnings && mlResponse.warnings.length > 0) {
        this.logger.warn(`⚠️  ML warnings: ${mlResponse.warnings.join(', ')}`);
      }

      // Enrich recommendations with actual product data from database
      const enrichedResponse =
        await this.enrichRecommendationsWithProducts(mlResponse);

      return enrichedResponse;
    } catch (error) {
      this.logger.error(
        `ML Recommendation failed: ${error.message}`,
        error.stack,
      );

      // If FastAPI is not available, provide helpful error
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        throw new HttpException(
          'AI recommendation service is currently unavailable. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        'Failed to get AI recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Enrich ML recommendations with actual product data from database
   */
  private async enrichRecommendationsWithProducts(
    mlResponse: any,
  ): Promise<RecommendationsResponseDto> {
    const enrichItem = async (item: any) => {
      try {
        // Try to find product by cloth_id in metadata
        const product = await this.prisma.product.findFirst({
          where: {
            status: 'APPROVED',
            is_deleted: false,
            OR: [
              // Try to match by metadata.cloth_id
              {
                metadata: {
                  path: ['cloth_id'],
                  equals: item.id,
                },
              },
              // Fallback: try direct product_id match (if cloth_id happens to be product_id)
              {
                product_id: item.id,
              },
            ],
          },
          include: {
            images: {
              orderBy: { order_index: 'asc' },
            },
            creator: {
              select: {
                store_name: true,
              },
            },
          },
        });

        if (!product) {
          this.logger.warn(`Product not found for cloth_id: ${item.id}`);
          return null;
        }

        // Extract image URLs
        const imageUrls = product.images.map((img) => img.url);
        const primaryImage =
          imageUrls.find((_, idx) => product.images[idx].is_primary) ||
          imageUrls[0];

        return {
          ...item,
          product_id: product.product_id,
          slug: product.slug,
          title: product.title,
          description: product.description || item.description,
          price_cents: product.price_cents,
          image: primaryImage,
          images: imageUrls,
          creator_name: product.creator?.store_name,
          inventory_count: product.inventory_count,
        };
      } catch (error) {
        this.logger.error(`Error enriching item ${item.id}: ${error.message}`);
        return null;
      }
    };

    // Enrich all three tiers
    const [perfectEnriched, goodEnriched, tryEnriched] = await Promise.all([
      Promise.all((mlResponse.perfect_for_you || []).map(enrichItem)),
      Promise.all((mlResponse.good_for_you || []).map(enrichItem)),
      Promise.all((mlResponse.you_can_also_try || []).map(enrichItem)),
    ]);

    // Filter out null values (products that weren't found)
    const perfect = perfectEnriched.filter((item) => item !== null);
    const good = goodEnriched.filter((item) => item !== null);
    const tryItems = tryEnriched.filter((item) => item !== null);

    const totalFound = perfect.length + good.length + tryItems.length;
    this.logger.log(
      `📦 Enriched ${totalFound} products from ${mlResponse.count} ML recommendations`,
    );

    return {
      perfect_for_you: perfect,
      good_for_you: good,
      you_can_also_try: tryItems,
      count: totalFound,
      warnings: mlResponse.warnings || [],
    };
  }

  /**
   * Download image from URL and convert to base64
   */
  private async downloadImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
        }),
      );

      const buffer = Buffer.from(response.data);
      return buffer.toString('base64');
    } catch (error) {
      this.logger.error(
        `Failed to download image from ${imageUrl}: ${error.message}`,
      );
      throw new HttpException(
        'Failed to download user image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Extract age from Aura
   */
  private extractAgeFromAura(aura: Aura): number {
    if (!aura.age_range) {
      return 25; // Default age
    }

    // Parse age range like "18-24" and return midpoint
    const match = aura.age_range.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      return Math.floor((min + max) / 2);
    }

    return 25;
  }

  /**
   * Extract size from Aura
   */
  private extractSizeFromAura(aura: Aura): string | null {
    // If Aura has size information, extract it
    // For now, return null to use default
    return null;
  }
}
