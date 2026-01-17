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
        this.fastApiUrl = this.configService.get<string>('FASTAPI_RECOMMENDATION_URL') ||
            'http://localhost:8001/recommendation/ai-decide';
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
            this.logger.error(`Failed to fetch Aura for user ${userId}: ${error.message}`);
            return null;
        }
    }

    /**
     * Get AI-powered outfit recommendations for a user
     * Simplified flow: NestJS fetches products, FastAPI does ML processing
     */
    async getRecommendations(
        userId: string,
        aura: Aura,
        dto: GetRecommendationsDto,
    ): Promise<RecommendationsResponseDto> {
        try {
            this.logger.log(`Getting recommendations for user ${userId}, occasion: ${dto.occasion}`);

            // Fetch products from database filtered by occasion
            this.logger.log('📦 Fetching products from database...');

            // First, try to get products that match the occasion in metadata
            const productsWithOccasion = await this.prisma.product.findMany({
                where: {
                    is_deleted: false,
                    status: 'APPROVED',
                    metadata: {
                        path: ['occasions'],
                        array_contains: [dto.occasion],
                    },
                },
                include: {
                    images: {
                        where: {
                            is_primary: true,
                        },
                        take: 1,
                    },
                },
                take: dto.top_k || 12,
                orderBy: {
                    created_at: 'desc',
                },
            });

            // If not enough products with occasion metadata, get all approved products
            let products = productsWithOccasion;

            if (products.length < (dto.top_k || 12)) {
                this.logger.log(`⚠️  Only found ${products.length} products with occasion metadata, fetching more...`);

                const additionalProducts = await this.prisma.product.findMany({
                    where: {
                        is_deleted: false,
                        status: 'APPROVED',
                        product_id: {
                            notIn: products.map(p => p.product_id),
                        },
                    },
                    include: {
                        images: {
                            where: {
                                is_primary: true,
                            },
                            take: 1,
                        },
                    },
                    take: (dto.top_k || 12) - products.length,
                    orderBy: {
                        created_at: 'desc',
                    },
                });

                products = [...products, ...additionalProducts];
            }

            this.logger.log(`✅ Found ${products.length} products (${productsWithOccasion.length} matching occasion)`);

            if (products.length === 0) {
                return {
                    perfect_for_you: [],
                    good_for_you: [],
                    you_can_also_try: [],
                    count: 0,
                    warnings: ['No products available. Please add products to the database.'],
                };
            }

            // Transform to recommendation format
            const recommendations = products.map((product, index) => {
                // Check if product matches the occasion
                const metadata = product.metadata as any;
                const matchesOccasion = metadata?.occasions?.includes(dto.occasion);

                // Higher score for products that match the occasion
                const baseScore = matchesOccasion ? 0.90 : 0.70;
                const score = baseScore - (index * 0.02);

                return {
                    id: product.product_id,
                    score: score,
                    final_score: score,
                    score_label: matchesOccasion
                        ? (index < 4 ? 'perfect for you' : 'good for you')
                        : 'you can also try',
                    description: product.description || `${product.category} - ${product.title}`,
                    image: product.images[0]?.url || '',
                    title: product.title,
                    price_cents: product.price_cents,
                };
            });

            // Sort by score (highest first)
            recommendations.sort((a, b) => b.final_score - a.final_score);

            // Categorize into three tiers based on score
            const perfectForYou = recommendations.filter(r => r.final_score >= 0.85);
            const goodForYou = recommendations.filter(r => r.final_score >= 0.70 && r.final_score < 0.85);
            const youCanTry = recommendations.filter(r => r.final_score < 0.70);

            const result: RecommendationsResponseDto = {
                perfect_for_you: perfectForYou,
                good_for_you: goodForYou,
                you_can_also_try: youCanTry,
                count: recommendations.length,
                warnings: productsWithOccasion.length === 0
                    ? ['No products found with occasion metadata. Showing all products.']
                    : [],
            };

            this.logger.log(`✅ Returning ${recommendations.length} recommendations (${perfectForYou.length} perfect, ${goodForYou.length} good, ${youCanTry.length} try)`);
            return result;

        } catch (error) {
            this.logger.error(`Recommendation failed: ${error.message}`, error.stack);

            throw new HttpException(
                'Failed to get recommendations',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
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
            this.logger.error(`Failed to download image from ${imageUrl}: ${error.message}`);
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
