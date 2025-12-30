import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseTryOnService } from '../common/base-tryon.service';
import { ImageValidatorService } from '../common/image-validator.service';
import { AIProvider } from '../../enums/ai-provider.enum';
import {
    AIServiceException,
    AIAuthenticationException,
    RateLimitException,
    ConfigurationException,
    ServiceUnavailableException,
} from '../../exceptions/tryon.exceptions';
import { TryOnErrorCode } from '../../enums/ai-provider.enum';
import { VERTEX_AI_TIMEOUT } from '../../constants/tryon.constants';

/**
 * Vertex AI Try-On Service
 * Calls external FastAPI service for Vertex AI try-on processing
 */
@Injectable()
export class VertexTryOnService extends BaseTryOnService {
    private readonly fastApiUrl: string;
    private readonly fastApiEnabled: boolean;

    constructor(
        imageValidator: ImageValidatorService,
        private readonly configService: ConfigService,
    ) {
        super(imageValidator, AIProvider.VERTEX_AI);

        // Get FastAPI service URL from environment
        this.fastApiUrl =
            this.configService.get<string>('FASTAPI_VERTEX_URL') ||
            'http://localhost:8000/vertex/try-on';

        this.fastApiEnabled = !!this.configService.get<string>('FASTAPI_VERTEX_URL');

        if (this.fastApiEnabled) {
            this.logger.log(`Vertex FastAPI service configured at: ${this.fastApiUrl}`);
        } else {
            this.logger.warn('  FASTAPI_VERTEX_URL not configured');
        }
    }

    /**
     * Perform virtual try-on by calling FastAPI Vertex service
     */
    protected async performTryOn(
        avatarBase64: string,
        clothingBase64: string,
        additionalParams?: Record<string, any>,
    ): Promise<string> {
        if (!this.fastApiEnabled) {
            throw new ConfigurationException(
                'Vertex FastAPI service is not configured. Please set FASTAPI_VERTEX_URL in environment variables.',
                { expectedUrl: 'http://localhost:8000/vertex/try-on' },
            );
        }

        try {
            this.logger.log(' Calling FastAPI Vertex service...');

            // Extract base64 data (remove data URI prefix if present)
            const avatarData = this.extractBase64Data(avatarBase64);
            const clothingData = this.extractBase64Data(clothingBase64);

            // Call FastAPI service with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), VERTEX_AI_TIMEOUT);

            const response = await fetch(this.fastApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    avatar_image: avatarData,
                    clothing_image: clothingData,
                    additional_params: additionalParams,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                return this.handleFastApiError(response);
            }

            const result = await response.json();

            if (!result.success || !result.result_image) {
                throw new AIServiceException(
                    TryOnErrorCode.PROCESSING_FAILED,
                    result.message || 'FastAPI service did not return a valid result',
                    500,
                    { fastApiResponse: result },
                );
            }

            this.logger.log('✅ Virtual try-on generated successfully via FastAPI');

            // Return result image (add data URI prefix if not present)
            const resultImage = result.result_image;
            return resultImage.startsWith('data:')
                ? resultImage
                : `data:image/jpeg;base64,${resultImage}`;

        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new AIServiceException(
                    TryOnErrorCode.TIMEOUT_ERROR,
                    'FastAPI Vertex service request timed out',
                    504,
                    { timeout: VERTEX_AI_TIMEOUT },
                );
            }

            if (error instanceof AIServiceException) {
                throw error;
            }

            return this.handleFastApiError(error);
        }
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
    private async handleFastApiError(errorOrResponse: any): Promise<never> {
        let errorData: any = {};
        let statusCode = 500;

        // If it's a Response object
        if (errorOrResponse instanceof Response) {
            statusCode = errorOrResponse.status;
            try {
                errorData = await errorOrResponse.json();
            } catch {
                errorData = { message: errorOrResponse.statusText };
            }
        } else {
            // If it's an error object
            errorData = {
                message: errorOrResponse.message || 'Unknown error',
                code: errorOrResponse.code,
            };
        }

        this.logger.error(`FastAPI Vertex error (${statusCode}): ${JSON.stringify(errorData)}`);

        // Map status codes to appropriate exceptions
        if (statusCode === 401 || errorData.error_code === 'INVALID_API_KEY') {
            throw new AIAuthenticationException(
                'FastAPI Vertex service authentication failed',
                { fastApiError: errorData },
            );
        }

        if (statusCode === 429 || errorData.error_code === 'RATE_LIMIT_EXCEEDED') {
            throw new RateLimitException(
                'FastAPI Vertex service rate limit exceeded',
                errorData.retry_after || 60,
            );
        }

        if (statusCode === 503 || errorData.error_code === 'SERVICE_UNAVAILABLE') {
            throw new ServiceUnavailableException(
                'FastAPI Vertex service is temporarily unavailable',
                { fastApiError: errorData },
            );
        }

        if (statusCode >= 500) {
            throw new AIServiceException(
                TryOnErrorCode.AI_SERVICE_ERROR,
                `FastAPI Vertex service error: ${errorData.message || 'Internal server error'}`,
                statusCode,
                { fastApiError: errorData },
            );
        }

        // Client errors (400-499)
        throw new AIServiceException(
            TryOnErrorCode.PROCESSING_FAILED,
            `FastAPI Vertex service error: ${errorData.message || 'Bad request'}`,
            statusCode,
            { fastApiError: errorData },
        );
    }

    /**
     * Check if FastAPI Vertex service is available
     */
    async isAvailable(): Promise<boolean> {
        if (!this.fastApiEnabled) {
            return false;
        }

        try {
            // Try to ping the health endpoint
            const healthUrl = this.fastApiUrl.replace('/vertex/try-on', '/health');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(healthUrl, {
                method: 'GET',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            this.logger.warn(`FastAPI Vertex service health check failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Get configuration status
     */
    getConfigurationStatus(): { configured: boolean; message?: string } {
        if (!this.fastApiEnabled) {
            return {
                configured: false,
                message: 'FASTAPI_VERTEX_URL not set in environment variables',
            };
        }

        return {
            configured: true,
            message: `FastAPI service URL: ${this.fastApiUrl}`,
        };
    }
}
