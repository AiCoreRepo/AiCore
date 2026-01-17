import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    HttpException,
    Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuraGuard } from '../common/guards/aura.guard';
import { CurrentAura } from '../common/decorators/aura.decorator';
import type { Aura } from '@prisma/client';
import { RecommendationService } from './recommendation.service';
import { GetRecommendationsDto } from './dto/recommendation-request.dto';
import { RecommendationsResponseDto } from './dto/recommendation-response.dto';

@ApiTags('Recommendations')
@Controller('api/recommendations')
@UseGuards(JwtAuthGuard)  // Temporarily removed AuraGuard to test
@ApiBearerAuth()
export class RecommendationController {
    private readonly logger = new Logger(RecommendationController.name);

    constructor(private readonly recommendationService: RecommendationService) { }

    @Post('ai-decide')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get AI-powered outfit recommendations',
        description: `
            Get personalized outfit recommendations using AI-powered Fusion MLP model.
            
            The system analyzes:
            - User's Aura (body shape, skin tone, age, preferences)
            - User's image (CLIP embeddings)
            - Product descriptions (text embeddings)
            - Product attributes (occasion, fit, fabric, etc.)
            
            Returns recommendations in three tiers:
            - Perfect for you (top 33%)
            - Good for you (middle 33%)
            - You can also try (bottom 33%)
            
            Requires:
            - Valid JWT token
            - User must have an Aura created
        `,
    })
    @ApiResponse({
        status: 200,
        description: 'Recommendations retrieved successfully',
        type: RecommendationsResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - Invalid input or missing Aura',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing JWT token',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error - Recommendation service failed',
    })
    async getRecommendations(
        @Request() req,
        @Body() dto: GetRecommendationsDto,
    ): Promise<RecommendationsResponseDto> {
        // Comprehensive debug logging
        this.logger.log('='.repeat(80));
        this.logger.log('📥 RECOMMENDATION REQUEST RECEIVED');
        this.logger.log(`🔐 req.user: ${JSON.stringify(req.user)}`);
        this.logger.log(`📋 Occasion: ${dto.occasion}`);

        // Extract user ID from JWT
        const userId = req.user?.user_id || req.user?.userId || req.user?.sub;

        this.logger.log(`🆔 Extracted userId: ${userId}`);

        if (!userId) {
            this.logger.error('❌ CRITICAL: User ID not found in JWT');
            this.logger.error(`req.user object: ${JSON.stringify(req.user)}`);
            throw new HttpException(
                'User ID is required',
                HttpStatus.BAD_REQUEST,
            );
        }

        // Fetch Aura for the user
        this.logger.log(`🔍 Fetching Aura for user ${userId}`);
        const aura = await this.recommendationService.getAuraForUser(userId);

        if (!aura) {
            this.logger.error(`❌ User ${userId} does not have an Aura`);
            throw new HttpException(
                'Please create your Aura first to get personalized recommendations',
                HttpStatus.BAD_REQUEST,
            );
        }

        this.logger.log(`✅ Aura found for user ${userId}`);
        this.logger.log(`✅ Processing recommendations for user ${userId}, occasion: ${dto.occasion}`);
        this.logger.log('='.repeat(80));

        return this.recommendationService.getRecommendations(userId, aura, dto);
    }
}
