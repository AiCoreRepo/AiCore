import { Injectable, Logger } from '@nestjs/common';
import { Occasion } from './enums/recommendation.enum';
import { RecommendationsResponseDto, RecommendationItemDto } from './dto/recommendation-response.dto';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

@Injectable()
export class DummyRecommendationService {
    private readonly logger = new Logger(DummyRecommendationService.name);
    private productsData: any[] = [];

    constructor() {
        this.loadProductData();
    }


    private loadProductData() {
        try {
            const csvPath = path.join(process.cwd(), 'Collection_data', 'main_train_data.csv');
            const fileContent = fs.readFileSync(csvPath, 'utf-8');

            this.productsData = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
            });

            this.logger.log(` Loaded ${this.productsData.length} products from CSV`);
        } catch (error) {
            this.logger.error(`Failed to load CSV data: ${error.message}`);
            this.productsData = [];
        }
    }


    async getDummyRecommendations(occasion: Occasion, userAgeRange?: string | null, userSkinTone?: string | null): Promise<RecommendationsResponseDto> {
        this.logger.log(`🎯 Getting dummy recommendations for occasion: ${occasion}`);
        if (userSkinTone) {
            this.logger.log(`🎨 Filtering by skin tone: ${userSkinTone}`);
        }

        // Filter products by occasion, age range, AND skin tone
        const filteredProducts = this.productsData.filter(product => {
            const productOccasion = product['@Occasion'];
            const productAgeGroup = product['@Age Group'];
            const productSkinTone = product['@Skin tone'];

            // Match occasion
            const matchesOccasion = productOccasion && productOccasion.toLowerCase() === occasion.toLowerCase();

            // If user has Aura with age range, match it; otherwise exclude 51+
            let matchesAge = true;
            if (userAgeRange) {
                // Match user's age range exactly
                matchesAge = productAgeGroup === userAgeRange;
            } else {
                // No Aura: just exclude 51+ age group
                matchesAge = productAgeGroup !== '51+';
            }

            // Match skin tone if user has one
            let matchesSkinTone = true;
            if (userSkinTone && productSkinTone) {
                // Parse product skin tones (e.g., "Light, Medium" -> ["light", "medium"])
                const productSkinTones = productSkinTone
                    .split(',')
                    .map(tone => tone.trim().toLowerCase());

                // Check if user's skin tone is in the product's skin tone list
                matchesSkinTone = productSkinTones.includes(userSkinTone.toLowerCase());
            }

            return matchesOccasion && matchesAge && matchesSkinTone;
        });

        this.logger.log(`📦 Found ${filteredProducts.length} products for ${occasion}`);

        // Filter out products without valid images
        const productsWithImages = filteredProducts.filter(product => {
            const hasImage = product.image_url && product.image_url.trim() !== '';
            if (!hasImage) {
                this.logger.warn(`⚠️  Skipping product without image: ${product.Image || 'unknown'}`);
            }
            return hasImage;
        });

        this.logger.log(`📸 Found ${productsWithImages.length} products with valid images`);

        // Sort by score (descending) and take top 4 best matches
        const topProducts = productsWithImages
            .sort((a, b) => parseFloat(b.Score || '0') - parseFloat(a.Score || '0'))
            .slice(0, 4);

        // Log the top products for debugging
        topProducts.forEach((product, index) => {
            this.logger.log(`🏆 #${index + 1}: ${product.Description?.substring(0, 50)}... (Score: ${product.Score})`);
        });

        // Convert to recommendation format
        const recommendations: RecommendationItemDto[] = topProducts.map((product, index) => {
            const score = parseFloat(product.Score || '0.5');
            const finalScore = Math.min(score + 0.1, 1.0); // Slightly boost final score

            return {
                id: product.Image || `dummy-${index}`,
                score: score,
                final_score: finalScore,
                score_label: this.getScoreLabel(finalScore),
                description: product.Description || 'Premium clothing item',
                image: product.image_url,
                images: [product.image_url],
                title: this.generateTitle(product),
                price_cents: this.generatePrice(product),
            };
        });

        // Return all 4 items in "perfect_for_you" tier
        const perfect = recommendations; // All 4 items
        const good: RecommendationItemDto[] = [];    // Empty
        const tryItems: RecommendationItemDto[] = []; // Empty

        this.logger.log(`✅ Returning ${recommendations.length} recommendations (${perfect.length} perfect, ${good.length} good, ${tryItems.length} try)`);

        const warnings = [
            `Filtered by occasion: ${occasion}`,
            `Found ${filteredProducts.length} total products for this occasion`,
            `Showing top 4 best matches`,
        ];

        if (userAgeRange) {
            warnings.push(`Age-matched to your Aura: ${userAgeRange}`);
        }

        if (userSkinTone) {
            warnings.push(`✨ Skin tone matched to your Aura: ${userSkinTone}`);
        }

        return {
            perfect_for_you: perfect,
            good_for_you: good,
            you_can_also_try: tryItems,
            count: recommendations.length,
            warnings,
        };
    }


    private async simulateProcessing(): Promise<void> {
        const delay = 1000 + Math.random() * 1000; // 1-2 seconds
        this.logger.log(`⏳ Simulating ML processing (${Math.round(delay)}ms)...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Get score label based on final score
     */
    private getScoreLabel(finalScore: number): string {
        if (finalScore >= 0.7) return 'perfect for you';
        if (finalScore >= 0.5) return 'good for you';
        return 'you can also try';
    }


    private generateTitle(product: any): string {
        const clothingType = product['Clothing Type'] || 'Outfit';
        const fabric = product.Fabric || '';
        const style = product.Style || '';

        return `${style} ${clothingType}${fabric ? ` in ${fabric}` : ''}`.trim();
    }


    private generatePrice(product: any): number {
        const score = parseFloat(product.Score || '0.5');
        const quality = product.Quality_Tag || 'good';

        // Base price ranges
        let basePrice = 2000; // ₹20

        if (quality === 'good') basePrice = 3000; // ₹30
        if (score > 0.8) basePrice += 2000; // High score items are more expensive

        // Add some randomness
        const variation = Math.random() * 1000;
        return Math.round(basePrice + variation);
    }
}
