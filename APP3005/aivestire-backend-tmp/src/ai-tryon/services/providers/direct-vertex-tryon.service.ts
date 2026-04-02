import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseTryOnService } from '../common/base-tryon.service';
import { ImageValidatorService } from '../common/image-validator.service';
import { ImageOptimizerService } from '../../../common/image-optimizer.service';
import { AIProvider } from '../../enums/ai-provider.enum';
import {
  AIServiceException,
  AIAuthenticationException,
  ConfigurationException,
} from '../../exceptions/tryon.exceptions';
import { TryOnErrorCode } from '../../enums/ai-provider.enum';
import { VERTEX_AI_TIMEOUT } from '../../constants/tryon.constants';
import * as fs from 'fs';
import * as path from 'path';

// Google Auth types
interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Direct Vertex AI Try-On Service
 * Calls Vertex AI directly without FastAPI intermediary
 */
@Injectable()
export class DirectVertexTryOnService extends BaseTryOnService {
  private readonly projectId: string;
  private readonly location: string;
  private readonly modelId: string;
  private serviceAccountCredentials: ServiceAccountCredentials | null = null;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(
    imageValidator: ImageValidatorService,
    private readonly configService: ConfigService,
    private readonly imageOptimizer: ImageOptimizerService,
  ) {
    super(imageValidator, AIProvider.VERTEX_AI);

    // Get Vertex AI configuration from environment
    this.projectId = this.configService.get<string>('VERTEX_PROJECT_ID') || '';
    this.location =
      this.configService.get<string>('VERTEX_LOCATION') || 'us-central1';
    this.modelId =
      this.configService.get<string>('VERTEX_MODEL_ID') ||
      'virtual-try-on-preview-08-04';

    // Load service account credentials
    this.loadServiceAccountCredentials();

    if (this.isConfigured()) {
      this.logger.log(`✅ Direct Vertex AI service configured`);
      this.logger.log(`   Project: ${this.projectId}`);
      this.logger.log(`   Location: ${this.location}`);
      this.logger.log(`   Model: ${this.modelId}`);
    } else {
      this.logger.warn('⚠️ Direct Vertex AI service not fully configured');
    }
  }

  /**
   * Load service account credentials from environment variable or file
   * Priority: GOOGLE_SERVICE_ACCOUNT_JSON (env var JSON) > File path > Default path
   */
  private loadServiceAccountCredentials(): void {
    // First try: Load from environment variable (JSON string) - best for production
    const saJsonEnv = this.configService.get<string>(
      'GOOGLE_SERVICE_ACCOUNT_JSON',
    );
    if (saJsonEnv) {
      try {
        this.serviceAccountCredentials = JSON.parse(saJsonEnv);
        this.logger.log(
          `✅ Service account loaded from GOOGLE_SERVICE_ACCOUNT_JSON env var`,
        );
        this.logger.log(
          `   Service account email: ${this.serviceAccountCredentials?.client_email}`,
        );

        // Use project ID from service account if not set in env
        if (!this.projectId && this.serviceAccountCredentials?.project_id) {
          (this as any).projectId = this.serviceAccountCredentials.project_id;
        }
        return;
      } catch (error) {
        this.logger.error(
          `❌ Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: ${error.message}`,
        );
      }
    }

    // Second try: Load from file path
    const saPath =
      this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS') ||
      this.configService.get<string>('VERTEX_SA_KEY_PATH') ||
      path.join(process.cwd(), 'service_account.json');

    try {
      if (fs.existsSync(saPath)) {
        const content = fs.readFileSync(saPath, 'utf-8');
        this.serviceAccountCredentials = JSON.parse(content);
        this.logger.log(`✅ Service account loaded from: ${saPath}`);
        this.logger.log(
          `   Service account email: ${this.serviceAccountCredentials?.client_email}`,
        );

        // Use project ID from service account if not set in env
        if (!this.projectId && this.serviceAccountCredentials?.project_id) {
          (this as any).projectId = this.serviceAccountCredentials.project_id;
        }
      } else {
        this.logger.warn(`⚠️ Service account file not found at: ${saPath}`);
        this.logger.warn(
          `   💡 TIP: Set GOOGLE_SERVICE_ACCOUNT_JSON env var with the JSON content for production`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Failed to load service account: ${error.message}`);
    }
  }

  /**
   * Check if the service is configured
   */
  private isConfigured(): boolean {
    return !!(this.projectId && this.serviceAccountCredentials);
  }

  /**
   * Generate OAuth2 access token from service account
   */
  private async getAccessToken(): Promise<string> {
    if (!this.serviceAccountCredentials) {
      throw new ConfigurationException(
        'Service account credentials not loaded',
        { hint: 'Set GOOGLE_APPLICATION_CREDENTIALS or VERTEX_SA_KEY_PATH' },
      );
    }

    // Return cached token if still valid (with 5 min buffer)
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 300000) {
      return this.cachedToken.token;
    }

    this.logger.debug('Generating new access token...');

    const { GoogleAuth } = await import('google-auth-library');

    const auth = new GoogleAuth({
      credentials: this.serviceAccountCredentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    if (!tokenResponse.token) {
      throw new AIAuthenticationException('Failed to generate access token', {
        error: 'Token response was empty',
      });
    }

    // Cache the token
    this.cachedToken = {
      token: tokenResponse.token,
      expiresAt: Date.now() + 3600000, // 1 hour
    };

    this.logger.debug('✅ Access token generated successfully');
    return tokenResponse.token;
  }

  /**
   * Clean and prepare base64 image data
   */
  private cleanBase64Data(base64String: string): string {
    // Remove data URI prefix if present
    if (base64String.startsWith('data:')) {
      const matches = base64String.match(/^data:[^;]+;base64,(.+)$/);
      if (matches) {
        return matches[1];
      }
    }
    // Remove whitespace and newlines
    return base64String.replace(/\s+/g, '');
  }

  /**
   * Convert image to JPEG if needed using sharp
   */
  private async convertToJpeg(base64Data: string): Promise<string> {
    const buffer = Buffer.from(base64Data, 'base64');

    // Check if already JPEG (starts with FF D8)
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      this.logger.debug('Image is already JPEG, no conversion needed');
      return base64Data;
    }

    this.logger.debug('Converting image to JPEG...');

    try {
      // Dynamically import sharp
      const sharp = (await import('sharp')).default;

      const jpegBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

      this.logger.debug(
        `✅ Converted to JPEG: ${buffer.length} -> ${jpegBuffer.length} bytes`,
      );
      return jpegBuffer.toString('base64');
    } catch (error) {
      this.logger.error(`Failed to convert image: ${error.message}`);
      // Return original if conversion fails
      return base64Data;
    }
  }

  /**
   * Perform virtual try-on by calling Vertex AI directly
   */
  protected async performTryOn(
    avatarBase64: string,
    clothingBase64: string,
    additionalParams?: Record<string, any>,
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new ConfigurationException(
        'Direct Vertex AI service is not configured. Please set VERTEX_PROJECT_ID and provide service_account.json',
        {
          projectId: this.projectId,
          hasCredentials: !!this.serviceAccountCredentials,
        },
      );
    }

    this.logger.log('🔵 DIRECT VERTEX AI - Starting try-on process...');

    // Step 1: Get access token
    const token = await this.getAccessToken();
    this.logger.log('✅ Access token obtained');

    // Step 2: Clean and convert images
    this.logger.log('🔄 Processing images...');
    const avatarClean = await this.convertToJpeg(
      this.cleanBase64Data(avatarBase64),
    );
    const clothingClean = await this.convertToJpeg(
      this.cleanBase64Data(clothingBase64),
    );
    this.logger.log(
      `✅ Images processed (avatar: ${avatarClean.length} chars, clothing: ${clothingClean.length} chars)`,
    );

    // Step 3: Build Vertex AI endpoint
    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelId}:predict`;
    this.logger.log(`🌐 Endpoint: ${endpoint}`);

    // Step 4: Build request payload
    const payload = {
      instances: [
        {
          personImage: { image: { bytesBase64Encoded: avatarClean } },
          productImages: [{ image: { bytesBase64Encoded: clothingClean } }],
        },
      ],
      parameters: {
        addWatermark: additionalParams?.add_watermark ?? true,
        // Increased baseSteps from 30 to 50 to reduce background hallucination and ensure
        // that the model spends more time separating the clothing from its background.
        baseSteps: additionalParams?.base_steps ?? 50,
        sampleCount: additionalParams?.sample_count ?? 1,
        outputOptions: {
          mimeType: 'image/jpeg',
          compressionQuality: additionalParams?.compression_quality ?? 90,
        },
      },
    };

    // Step 5: Call Vertex AI
    this.logger.log('🚀 Calling Vertex AI API...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VERTEX_AI_TIMEOUT);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      this.logger.log(`📥 Vertex AI response status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMessage = errorBody?.error?.message || response.statusText;

        this.logger.error(`❌ Vertex AI error: ${JSON.stringify(errorBody)}`);

        if (response.status === 401) {
          // Clear cached token on auth error
          this.cachedToken = null;
          throw new AIAuthenticationException(
            `Vertex AI authentication failed: ${errorMessage}`,
            { status: response.status, error: errorBody },
          );
        }

        throw new AIServiceException(
          TryOnErrorCode.AI_SERVICE_ERROR,
          `Vertex AI request failed: ${errorMessage}`,
          response.status,
          { error: errorBody },
        );
      }

      const result = await response.json();

      // Extract base64 image from response
      const predictions = result.predictions || [];
      if (!predictions.length) {
        throw new AIServiceException(
          TryOnErrorCode.PROCESSING_FAILED,
          'Vertex AI returned no predictions',
          500,
          { result },
        );
      }

      // Find the image in the response
      let imageBase64 = '';
      for (const pred of predictions) {
        if (pred.bytesBase64Encoded) {
          imageBase64 = pred.bytesBase64Encoded;
          break;
        }
        if (pred.image?.bytesBase64Encoded) {
          imageBase64 = pred.image.bytesBase64Encoded;
          break;
        }
      }

      if (!imageBase64) {
        throw new AIServiceException(
          TryOnErrorCode.PROCESSING_FAILED,
          'No image data found in Vertex AI response',
          500,
          { predictions },
        );
      }

      this.logger.log(
        '✅ DIRECT VERTEX AI - Virtual try-on completed successfully!',
      );

      return `data:image/jpeg;base64,${imageBase64}`;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new AIServiceException(
          TryOnErrorCode.TIMEOUT_ERROR,
          'Vertex AI request timed out',
          504,
          { timeout: VERTEX_AI_TIMEOUT },
        );
      }

      if (error instanceof AIServiceException) {
        throw error;
      }

      throw new AIServiceException(
        TryOnErrorCode.AI_SERVICE_ERROR,
        `Vertex AI request failed: ${error.message}`,
        500,
        { error: error.message },
      );
    }
  }

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      // Try to get an access token as a health check
      await this.getAccessToken();
      return true;
    } catch (error) {
      this.logger.warn(
        `Direct Vertex AI service health check failed: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Get configuration status
   */
  getConfigurationStatus(): { configured: boolean; message?: string } {
    if (!this.projectId) {
      return {
        configured: false,
        message: 'VERTEX_PROJECT_ID not set in environment variables',
      };
    }

    if (!this.serviceAccountCredentials) {
      return {
        configured: false,
        message:
          'Service account credentials not loaded. Set GOOGLE_APPLICATION_CREDENTIALS or place service_account.json in project root',
      };
    }

    return {
      configured: true,
      message: `Direct Vertex AI: ${this.projectId} / ${this.location} / ${this.modelId}`,
    };
  }

  protected async postprocessResult(resultImage: string): Promise<string> {
    return this.imageOptimizer.normalizeToPortraitCanvas(resultImage, {
      targetAspectRatio: 2 / 3,
      maxWidth: 1200,
      maxHeight: 1800,
      quality: 90,
      format: 'jpeg',
    });
  }
}
