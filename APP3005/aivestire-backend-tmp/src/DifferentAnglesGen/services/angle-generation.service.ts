import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CloudinaryService,
  CloudinaryMetadata,
} from '../../common/cloudinary.service';
import { ImageOptimizerService } from '../../common/image-optimizer.service';
import { AngleSessionManagerService } from './angle-session-manager.service';
import { AngleType } from '../enums/angle.enum';
import {
  GEMINI_MODEL_ID,
  GENERATION_TIMEOUT,
} from '../constants/angle.constants';
import { generateAnglePrompt } from '../prompts/angle-generation.prompts';
import { GenerateAnglesRequestDto } from '../dto/generate-angles-request.dto';
import { GenerateAnglesResponseDto } from '../dto/generate-angles-response.dto';

/**
 * Service for generating different angles from try-on images using Gemini AI
 */
@Injectable()
export class AngleGenerationService {
  private readonly logger = new Logger(AngleGenerationService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly imageOptimizer: ImageOptimizerService,
    private readonly sessionManager: AngleSessionManagerService,
  ) {
    // Initialize Gemini AI client
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        '⚠️ GEMINI_API_KEY not found in environment variables. Angle generation will fail.',
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  /**
   * Main entry point for angle generation
   */
  async generateAngle(
    request: GenerateAnglesRequestDto,
  ): Promise<GenerateAnglesResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `🎬 Starting angle generation for product ${request.productId}`,
      );

      // Get aura to extract user_id
      const aura = await this.prisma.aura.findUnique({
        where: { aura_id: request.auraId },
      });

      if (!aura) {
        throw new HttpException('Aura not found', HttpStatus.NOT_FOUND);
      }

      // Determine which angle to generate
      let targetAngle: AngleType;
      let sessionKey: string;

      if (request.angle) {
        // Use explicitly requested angle
        targetAngle = request.angle;
        sessionKey = `${aura.user_id}_${request.productId}`;
        this.logger.log(`✅ Using explicitly requested angle: ${targetAngle}`);
      } else {
        // Auto-determine next angle in sequence
        const [angle, index] = this.sessionManager.getNextAngle(
          aura.user_id,
          request.productId,
        );
        targetAngle = angle;
        sessionKey = `${aura.user_id}_${request.productId}`;
        this.logger.log(
          `✅ Auto-selected next angle: ${targetAngle} (index: ${index})`,
        );
      }

      // Get cached metadata if available
      let cachedMetadata = request.cachedMetadata;
      if (
        !cachedMetadata &&
        request.previousImageUrl.includes('cloudinary.com')
      ) {
        cachedMetadata =
          (await this.extractCachedMetadata(request.previousImageUrl)) ||
          undefined;
      }

      // Ensure we have base64 image data
      const imageBase64 = await this.ensureBase64(request.previousImageUrl);
      const imageSizeKB = Math.round(imageBase64.length / 1024);

      this.logger.log(
        `📦 Using full resolution image for angle generation: ${imageSizeKB} KB`,
      );

      // Generate prompt
      const prompt = generateAnglePrompt(targetAngle, cachedMetadata);

      // Call Gemini AI
      const resultImageBase64 = await this.callGeminiAI(imageBase64, prompt);

      // Upload to Cloudinary and save to database
      const uploadedUrl = await this.uploadAndSave(
        resultImageBase64,
        aura.user_id,
        request.productId,
        request.auraId,
        targetAngle,
      );

      const processingTime = Date.now() - startTime;

      this.logger.log(`✅ Angle generation completed in ${processingTime}ms`);

      return {
        success: true,
        resultImage: resultImageBase64.startsWith('data:')
          ? resultImageBase64
          : `data:image/jpeg;base64,${resultImageBase64}`,
        angle: targetAngle,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        metadata: {
          cachingUsed: !!cachedMetadata,
          sessionKey,
          modelId: GEMINI_MODEL_ID,
          fullResolutionUsed: true,
          imageSizeKB,
        },
      };
    } catch (error) {
      this.logger.error(` Angle generation failed: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Angle generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Call Gemini AI to generate the angle
   */
  private async callGeminiAI(
    imageBase64: string,
    prompt: string,
  ): Promise<string> {
    try {
      this.logger.log(`🤖 Calling Gemini AI (${GEMINI_MODEL_ID})...`);

      const model = this.genAI.getGenerativeModel({
        model: GEMINI_MODEL_ID,
      });

      // Remove data URI prefix if present
      const cleanBase64 = imageBase64.replace(
        /^data:image\/[a-z]+;base64,/,
        '',
      );

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Gemini AI request timed out'));
        }, GENERATION_TIMEOUT);
      });

      // Create generation promise
      const generationPromise = model.generateContent([
        {
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/jpeg',
          },
        },
        { text: prompt },
      ]);

      // Race between generation and timeout
      const result = await Promise.race([generationPromise, timeoutPromise]);

      // Extract image from response
      const response = result.response;
      const candidates = response.candidates;

      if (!candidates || candidates.length === 0) {
        throw new Error('No candidates returned from Gemini AI');
      }

      const parts = candidates[0].content.parts;
      if (!parts || parts.length === 0) {
        throw new Error('No parts in Gemini AI response');
      }

      // Find the image part
      const imagePart = parts.find((part) => part.inlineData);
      if (!imagePart || !imagePart.inlineData) {
        throw new Error('No image data in Gemini AI response');
      }

      this.logger.log('✅ Gemini AI generation successful');

      return imagePart.inlineData.data;
    } catch (error) {
      this.logger.error(`❌ Gemini AI call failed: ${error.message}`);
      throw new HttpException(
        `Gemini AI generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ensure we have base64 data (download if URL)
   */
  private async ensureBase64(input: string): Promise<string> {
    // If it's already base64, return it (cleaned)
    if (input.startsWith('data:') || input.length > 500) {
      return input.replace(/^data:image\/[a-z]+;base64,/, '');
    }

    // It's a URL, download it
    if (input.startsWith('http')) {
      this.logger.log(`⬇️ Downloading image from URL...`);
      try {
        const response = await fetch(input);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer).toString('base64');
      } catch (error) {
        this.logger.error(`Failed to download image: ${error.message}`);
        throw new HttpException(
          'Failed to download image',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return input;
  }

  /**
   * Extract cached metadata from Cloudinary
   */
  private async extractCachedMetadata(
    imageUrl: string,
  ): Promise<Record<string, any> | null> {
    try {
      const publicId = this.cloudinaryService.extractPublicId(imageUrl);
      if (!publicId) return null;

      // Try to find existing try-on with this Cloudinary ID
      const existingTryOn = await this.prisma.tryOn.findFirst({
        where: { cloudinary_public_id: publicId },
        orderBy: { created_at: 'desc' },
      });

      if (existingTryOn?.metadata_cache) {
        this.logger.log('✅ Using cached metadata from database');
        return existingTryOn.metadata_cache as Record<string, any>;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to extract cached metadata: ${error.message}`);
      return null;
    }
  }

  /**
   * Upload result to Cloudinary and save to database
   */
  private async uploadAndSave(
    imageBase64: string,
    userId: string,
    productId: string,
    auraId: string,
    angle: AngleType,
  ): Promise<string> {
    try {
      // Add data URI prefix if not present
      const imageData = imageBase64.startsWith('data:')
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;

      // Extract metadata
      const imageMetadata =
        await this.imageOptimizer.extractImageMetadata(imageData);
      const dominantColors = await this.imageOptimizer.extractDominantColors(
        imageData,
        3,
      );

      // Upload to Cloudinary
      const cloudinaryMetadata: CloudinaryMetadata = {
        userId,
        productId,
        auraId,
        dominantColors,
        imageType: 'angle',
        angle,
      };

      const uploadResult = await this.cloudinaryService.uploadWithMetadata(
        imageData,
        cloudinaryMetadata,
        'try-ons',
      );

      // Create thumbnail
      const thumbnailUrl = this.cloudinaryService.getThumbnailUrl(
        uploadResult.publicId,
        512,
      );
      const compressedUrl = this.cloudinaryService.getCompressedUrl(
        uploadResult.publicId,
        75,
      );

      // Save to database
      await this.prisma.tryOn.create({
        data: {
          user_id: userId,
          product_id: productId,
          aura_id: auraId,
          result_image_url: uploadResult.secureUrl,
          provider: 'gemini',
          angle,
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
        },
      });

      this.logger.log(`✅ Uploaded to Cloudinary: ${uploadResult.secureUrl}`);

      return uploadResult.secureUrl;
    } catch (error) {
      this.logger.error(`Failed to upload and save: ${error.message}`);
      // Don't fail the request if upload fails
      return '';
    }
  }
}
