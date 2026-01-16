import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    BodyAnalysisResultDto,
    FastAPIBodyAnalysisResponse,
} from '../dto/body-analyzer.dto';
import {
    AIServiceException,
    ConfigurationException,
    ServiceUnavailableException,
} from '../exceptions/tryon.exceptions';
import { TryOnErrorCode } from '../enums/ai-provider.enum';

/**
 * Body Analyzer Service
 * 
 * Calls external FastAPI service to analyze user images for:
 * - Skin tone detection (Light, Medium, Dusky, Deep)
 * - Skin color hexes (3 shades)
 * - Body shape detection (Rectangle, Pear, Apple, Hourglass, Inverted Triangle)
 * - Full body detection
 */
@Injectable()
export class BodyAnalyzerService {
    private readonly logger = new Logger(BodyAnalyzerService.name);
    private readonly fastApiUrl: string;
    private readonly fastApiEnabled: boolean;
    private readonly timeout = 60000; // 60 seconds

    constructor(private readonly configService: ConfigService) {
        // Get FastAPI service URL from environment
        // Default to port 8000 where the main FastAPI service runs
        this.fastApiUrl =
            this.configService.get<string>('FASTAPI_BODY_ANALYZE_URL') ||
            'http://localhost:8001/body_analyze_json';

        this.fastApiEnabled = !!this.configService.get<string>('FASTAPI_BODY_ANALYZE_URL');

        if (this.fastApiEnabled) {
            this.logger.log(`✅ Body Analyzer FastAPI service configured at: ${this.fastApiUrl}`);
        } else {
            this.logger.warn('⚠️  FASTAPI_BODY_ANALYZE_URL not configured, using default localhost:8000');
        }
    }

    /**
     * Analyze an image for body attributes
     * 
     * @param imageBase64 - Base64 encoded image (with or without data URI prefix)
     * @returns Body analysis result with skin tone, body shape, etc.
     */
    async analyzeImage(imageBase64: string): Promise<BodyAnalysisResultDto> {
        const startTime = Date.now();

        try {
            this.logger.log('🔍 Starting body analysis...');

            // Extract base64 data (remove data URI prefix if present)
            const cleanBase64 = this.extractBase64Data(imageBase64);

            // Call FastAPI service with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            this.logger.log(`🔗 Calling FastAPI: ${this.fastApiUrl}`);
            const response = await fetch(this.fastApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_base64: cleanBase64,
                }),
                signal: controller.signal,
            });

            this.logger.log(`📡 FastAPI response status: ${response.status}`);

            clearTimeout(timeoutId);

            if (!response.ok) {
                return this.handleFastApiError(response);
            }

            const result: FastAPIBodyAnalysisResponse = await response.json();
            const processingTime = Date.now() - startTime;

            this.logger.log(`✅ Body analysis completed in ${processingTime}ms`);
            this.logger.log(`   - Skin tone: ${result.skin_tone_label}`);
            this.logger.log(`   - Body shape: ${result.body_shape}`);
            this.logger.log(`   - Full body: ${result.full_body}`);

            // Transform snake_case response to camelCase
            return {
                success: true,
                skinToneLabel: result.skin_tone_label,
                skinHexes: result.skin_hexes || [],
                bodyShape: result.body_shape,
                fullBody: result.full_body,
                processingTime,
            };

        } catch (error: any) {
            if (error.name === 'AbortError') {
                this.logger.error('Body analysis request timed out');
                return {
                    success: false,
                    skinHexes: [],
                    fullBody: false,
                    error: 'Body analysis request timed out. Please try again.',
                    processingTime: Date.now() - startTime,
                };
            }

            if (error instanceof AIServiceException) {
                throw error;
            }

            this.logger.error(`Body analysis failed: ${error.message}`);
            return {
                success: false,
                skinHexes: [],
                fullBody: false,
                error: `Body analysis failed: ${error.message}`,
                processingTime: Date.now() - startTime,
            };
        }
    }

    /**
     * Analyze image from file buffer
     * 
     * @param buffer - Image file buffer
     * @param mimetype - Image MIME type
     * @returns Body analysis result
     */
    async analyzeImageBuffer(buffer: Buffer, mimetype: string): Promise<BodyAnalysisResultDto> {
        // Convert buffer to base64 data URI
        const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
        return this.analyzeImage(base64);
    }

    /**
     * Extract base64 data from data URI or return as-is
     */
    private extractBase64Data(base64String: string): string {
        if (base64String.startsWith('data:')) {
            const matches = base64String.match(/^data:[^;]+;base64,(.+)$/);
            return matches ? matches[1] : base64String;
        }
        return base64String;
    }

    /**
     * Handle FastAPI service errors
     */
    private async handleFastApiError(response: Response): Promise<never> {
        let errorData: any = {};
        const statusCode = response.status;

        try {
            errorData = await response.json();
        } catch {
            errorData = { message: response.statusText };
        }

        this.logger.error(`FastAPI Body Analyzer error (${statusCode}): ${JSON.stringify(errorData)}`);

        if (statusCode === 500 && errorData.detail) {
            throw new AIServiceException(
                TryOnErrorCode.PROCESSING_FAILED,
                `Body analysis failed: ${errorData.detail}`,
                statusCode,
                { fastApiError: errorData },
            );
        }

        if (statusCode === 400) {
            throw new AIServiceException(
                TryOnErrorCode.INVALID_IMAGE_FORMAT,
                `Invalid image for body analysis: ${errorData.detail || 'Bad request'}`,
                statusCode,
                { fastApiError: errorData },
            );
        }

        if (statusCode === 503) {
            throw new ServiceUnavailableException(
                'Body analyzer service is temporarily unavailable',
                { fastApiError: errorData },
            );
        }

        throw new AIServiceException(
            TryOnErrorCode.AI_SERVICE_ERROR,
            `Body analyzer service error: ${errorData.detail || errorData.message || 'Unknown error'}`,
            statusCode,
            { fastApiError: errorData },
        );
    }

    /**
     * Check if the FastAPI body analyzer service is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            // Get base URL and construct health endpoint
            const baseUrl = this.fastApiUrl.replace('/body_analyze_json', '').replace('/body_analyze', '');
            const healthUrl = `${baseUrl}/health`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            this.logger.warn(`Body analyzer health check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get configuration status
     */
    getConfigurationStatus(): { configured: boolean; message?: string } {
        return {
            configured: true, // Always configured with default fallback
            message: `FastAPI service URL: ${this.fastApiUrl}`,
        };
    }
}
