import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

// Cloudinary upload configuration constants
const CLOUDINARY_UPLOAD_OPTIONS = {
  timeout: 120000, // 120 seconds timeout
  chunk_size: 6000000, // 6MB chunks for large files
  resource_type: 'auto' as const, // Auto-detect resource type
};

/**
 * Metadata to store with Cloudinary uploads
 */
export interface CloudinaryMetadata {
  userId?: string;
  productId?: string;
  auraId?: string;
  tryOnId?: string;
  dominantColors?: string[];
  imageType?: 'try-on' | 'angle' | 'avatar' | 'product' | 'review';
  angle?: string; // front, left, right, back, etc.
  processingTime?: number;
  [key: string]: any;
}

/**
 * Result from Cloudinary upload with metadata
 */
export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  metadata?: CloudinaryMetadata;
}

/**
 * Transformation options for Cloudinary URLs
 */
export interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'thumb';
  quality?: 'auto' | 'auto:low' | 'auto:good' | 'auto:best' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp';
  effect?: string;
}

/**
 * Enhanced Cloudinary service with metadata caching and transformations
 * Optimized for AI try-on image storage and retrieval
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly cloudName: string;
  private isAvailable = false;

  constructor(private readonly configService: ConfigService) {
    this.cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') || '';
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!this.cloudName || !apiKey || !apiSecret) {
      if (process.env.NODE_ENV === 'test') {
        this.logger.warn(
          'Cloudinary credentials are missing; image upload/processing is disabled in test environment.',
        );
        this.isAvailable = false;
        return;
      }
      throw new Error('Cloudinary configuration is missing in .env file');
    }

    this.isAvailable = true;

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    this.logger.log(`✅ Cloudinary configured: ${this.cloudName}`);
  }

  /**
   * Upload image with metadata for caching and optimization
   * @param file - Base64 image or file path
   * @param metadata - Metadata to store with the image
   * @param folder - Cloudinary folder path, default 'try-ons'
   * @returns Upload result with URLs and metadata
   */
  async uploadWithMetadata(
    file: string,
    metadata: CloudinaryMetadata = {},
    folder: string = 'try-ons',
  ): Promise<CloudinaryUploadResult> {
    if (!this.isAvailable) {
      throw new Error('Cloudinary is not configured');
    }

    return new Promise((resolve, reject) => {
      this.logger.log(`☁️ Uploading to Cloudinary folder: ${folder}`);

      // Build context metadata (key-value pairs stored with image)
      const context: Record<string, string> = {};
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          context[key] =
            typeof value === 'object' ? JSON.stringify(value) : String(value);
        }
      });

      // Build tags for easy searching
      const tags: string[] = ['try-on'];
      if (metadata.userId) tags.push(`user:${metadata.userId}`);
      if (metadata.productId) tags.push(`product:${metadata.productId}`);
      if (metadata.imageType) tags.push(metadata.imageType);

      cloudinary.uploader.upload(
        file,
        {
          ...CLOUDINARY_UPLOAD_OPTIONS,
          folder,
          context,
          tags,
          // Enable auto-optimization
          quality: 'auto:good',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error(`❌ Cloudinary upload failed: ${error?.message}`);
            reject(new Error('Failed to upload image to Cloudinary'));
          } else {
            this.logger.log(`✅ Upload success: ${result.secure_url}`);
            resolve({
              url: result.url,
              secureUrl: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
              metadata,
            });
          }
        },
      );
    });
  }

  /**
   * Legacy upload method (backward compatibility)
   */
  async uploadImage(file: string): Promise<string> {
    const result = await this.uploadWithMetadata(file);
    return result.secureUrl;
  }

  /**
   * Upload an image without applying upload-time quality or format transforms.
   * Use this when the caller needs Cloudinary to store the user's original bytes
   * as closely as the API allows.
   */
  async uploadOriginalImage(
    file: string,
    folder: string = 'creator-products',
  ): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Cloudinary is not configured');
    }

    return new Promise((resolve, reject) => {
      this.logger.log(`☁️ Uploading original image to Cloudinary folder: ${folder}`);

      cloudinary.uploader.upload(
        file,
        {
          ...CLOUDINARY_UPLOAD_OPTIONS,
          resource_type: 'image',
          folder,
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error(`❌ Cloudinary upload failed: ${error?.message}`);
            reject(new Error('Failed to upload image to Cloudinary'));
          } else {
            this.logger.log(`✅ Upload success: ${result.secure_url}`);
            resolve(result.secure_url);
          }
        },
      );
    });
  }

  /**
   * Upload an image buffer directly. This avoids browser/base64 JSON overhead and
   * does not request Cloudinary quality or format transformations.
   */
  async uploadImageBuffer(
    buffer: Buffer,
    options: {
      folder?: string;
      originalFilename?: string;
    } = {},
  ): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Cloudinary is not configured');
    }

    const folder = options.folder ?? 'creator-products';

    return new Promise((resolve, reject) => {
      this.logger.log(`☁️ Uploading original image buffer to Cloudinary folder: ${folder}`);

      const stream = cloudinary.uploader.upload_stream(
        {
          ...CLOUDINARY_UPLOAD_OPTIONS,
          resource_type: 'image',
          folder,
          use_filename: Boolean(options.originalFilename),
          filename_override: options.originalFilename,
        },
        (error, result) => {
          if (error || !result) {
            this.logger.error(`❌ Cloudinary buffer upload failed: ${error?.message}`);
            reject(new Error('Failed to upload image to Cloudinary'));
          } else {
            this.logger.log(`✅ Upload success: ${result.secure_url}`);
            resolve(result.secure_url);
          }
        },
      );

      stream.end(buffer);
    });
  }

  /**
   * Get optimized URL with transformations (for thumbnails, compression, etc.)
   * @param publicId - Cloudinary public ID
   * @param transformations - Transformation options
   * @returns Transformed URL
   */
  getTransformedUrl(
    publicId: string,
    transformations: CloudinaryTransformation = {},
  ): string {
    if (!this.isAvailable) {
      return '';
    }

    const {
      width,
      height,
      crop = 'limit',
      quality = 'auto:good',
      format = 'auto',
      effect,
    } = transformations;

    const url = cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      fetch_format: format,
      effect,
    });

    this.logger.log(
      `🔗 Generated transformed URL: ${url.substring(0, 100)}...`,
    );
    return url;
  }

  /**
   * Get thumbnail URL for faster AI processing
   * @param publicId - Cloudinary public ID
   * @param size - Thumbnail size (default 512px)
   * @returns Thumbnail URL
   */
  getThumbnailUrl(publicId: string, size: number = 512): string {
    return this.getTransformedUrl(publicId, {
      width: size,
      height: size,
      crop: 'limit',
      quality: 'auto:low',
      format: 'jpg',
    });
  }

  /**
   * Get compressed URL for reduced payload size
   * @param publicId - Cloudinary public ID
   * @param quality - Quality level (1-100 or 'auto')
   * @returns Compressed URL
   */
  getCompressedUrl(publicId: string, quality: number | 'auto' = 75): string {
    return this.getTransformedUrl(publicId, {
      quality: typeof quality === 'number' ? quality : 'auto:good',
      format: 'jpg',
    });
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param imageUrl - Full Cloudinary URL
   * @returns Public ID or null if not a valid Cloudinary URL
   */
  extractPublicId(imageUrl: string): string | null {
    try {
      // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
      const urlParts = imageUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');

      if (uploadIndex === -1) return null;

      // Get everything after 'upload' and version
      const pathParts = urlParts.slice(uploadIndex + 2); // Skip 'upload' and version
      const fileNameWithExt = pathParts.join('/');

      // Remove file extension
      const publicId = fileNameWithExt.replace(/\.[^/.]+$/, '');

      return publicId;
    } catch (error) {
      this.logger.error(
        `Failed to extract public ID from URL: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Get metadata stored with an image
   * @param publicId - Cloudinary public ID
   * @returns Metadata object or null
   */
  async getImageMetadata(publicId: string): Promise<CloudinaryMetadata | null> {
    try {
      if (!this.isAvailable) {
        return null;
      }

      const result = await cloudinary.api.resource(publicId, {
        context: true,
      });

      if (result.context && result.context.custom) {
        // Parse stored metadata
        const metadata: CloudinaryMetadata = {};
        Object.entries(result.context.custom).forEach(([key, value]) => {
          try {
            metadata[key] = JSON.parse(value as string);
          } catch {
            metadata[key] = value;
          }
        });
        return metadata;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to get metadata for ${publicId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      if (!this.isAvailable) {
        throw new Error('Cloudinary is not configured');
      }

      const publicId = this.extractPublicId(imageUrl);

      if (!publicId) {
        throw new Error('Invalid Cloudinary URL');
      }

      this.logger.log(`🗑️ Deleting image: ${publicId}`);

      await cloudinary.uploader.destroy(publicId);
      this.logger.log('✅ Image deleted successfully');
    } catch (error) {
      this.logger.error(`Failed to delete image: ${error.message}`);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  /**
   * Delete image by public ID
   */
  async deleteByPublicId(publicId: string): Promise<void> {
    try {
      if (!this.isAvailable) {
        throw new Error('Cloudinary is not configured');
      }

      this.logger.log(`🗑️ Deleting image by public ID: ${publicId}`);
      await cloudinary.uploader.destroy(publicId);
      this.logger.log('✅ Image deleted successfully');
    } catch (error) {
      this.logger.error(`Failed to delete image: ${error.message}`);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }
}
