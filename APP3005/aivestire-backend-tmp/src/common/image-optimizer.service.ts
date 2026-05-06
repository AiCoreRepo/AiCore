import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

/**
 * Image metadata extracted from analysis
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number; // Size in bytes
  dominantColors?: string[]; // Hex color codes
  hasAlpha: boolean;
}

/**
 * Compression options for image optimization
 */
export interface CompressionOptions {
  quality?: number; // 1-100, default 75
  maxWidth?: number; // Max width in pixels, default 1024
  maxHeight?: number; // Max height in pixels, default 1024
  format?: 'jpeg' | 'png' | 'webp'; // Output format, default 'jpeg'
}

export interface PortraitCanvasOptions {
  targetAspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  backgroundStyle?: 'blurred' | 'solid';
  backgroundColor?: {
    r: number;
    g: number;
    b: number;
    alpha?: number;
  };
}

/**
 * Service for optimizing and compressing images before sending to AI models
 * Reduces token consumption and improves processing speed
 */
@Injectable()
export class ImageOptimizerService {
  private readonly logger = new Logger(ImageOptimizerService.name);

  // Default compression settings optimized for AI processing
  private readonly DEFAULT_QUALITY = 75;
  private readonly DEFAULT_MAX_DIMENSION = 1024;
  private readonly THUMBNAIL_SIZE = 512;
  private readonly TRY_ON_AVATAR_RETAIN_RATIO = 0.88;
  private readonly DEFAULT_PORTRAIT_ASPECT_RATIO = 2 / 3;
  private readonly DEFAULT_PORTRAIT_MAX_WIDTH = 1200;
  private readonly DEFAULT_PORTRAIT_MAX_HEIGHT = 1800;

  /**
   * Compress a base64 image to reduce payload size
   * @param base64Image - Base64 encoded image (with or without data URI prefix)
   * @param options - Compression options
   * @returns Compressed base64 image with data URI prefix
   */
  async compressImage(
    base64Image: string,
    options: CompressionOptions = {},
  ): Promise<string> {
    try {
      const startTime = Date.now();

      // Extract base64 data (remove data URI prefix if present)
      const base64Data = this.extractBase64Data(base64Image);
      const imageBuffer = Buffer.from(base64Data, 'base64');

      const {
        quality = this.DEFAULT_QUALITY,
        maxWidth = this.DEFAULT_MAX_DIMENSION,
        maxHeight = this.DEFAULT_MAX_DIMENSION,
        format = 'jpeg',
      } = options;

      this.logger.log(
        `🔄 Compressing image: quality=${quality}, max=${maxWidth}x${maxHeight}, format=${format}`,
      );

      // Process image with sharp
      let pipeline = sharp(imageBuffer);

      // Resize if needed (maintain aspect ratio)
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });

      // Apply format-specific compression
      if (format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      } else if (format === 'png') {
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      }

      const compressedBuffer = await pipeline.toBuffer();

      // Calculate compression ratio
      const originalSize = imageBuffer.length;
      const compressedSize = compressedBuffer.length;
      const compressionRatio = (
        (1 - compressedSize / originalSize) *
        100
      ).toFixed(2);
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Image compressed: ${this.formatBytes(originalSize)} → ${this.formatBytes(compressedSize)} ` +
          `(${compressionRatio}% reduction) in ${processingTime}ms`,
      );

      // Convert back to base64 with data URI prefix
      const mimeType =
        format === 'png'
          ? 'image/png'
          : format === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
      return `data:${mimeType};base64,${compressedBuffer.toString('base64')}`;
    } catch (error) {
      this.logger.error(`Failed to compress image: ${error.message}`);
      throw new Error(`Image compression failed: ${error.message}`);
    }
  }

  /**
   * Create a thumbnail version of an image for faster AI processing
   * @param base64Image - Base64 encoded image
   * @param maxSize - Maximum dimension (width or height), default 512px
   * @returns Thumbnail as base64 with data URI prefix
   */
  async createThumbnail(
    base64Image: string,
    maxSize: number = this.THUMBNAIL_SIZE,
  ): Promise<string> {
    this.logger.log(`🔄 Creating thumbnail: max size=${maxSize}px`);

    return this.compressImage(base64Image, {
      quality: 70, // Lower quality for thumbnails
      maxWidth: maxSize,
      maxHeight: maxSize,
      format: 'jpeg',
    });
  }

  /**
   * Crop the lowest section of a full-body avatar so try-on uses a footwear-free version.
   * This keeps the crop deterministic and avoids introducing new AI artifacts.
   */
  async cropAvatarForTryOn(imageInput: string): Promise<string> {
    try {
      const imageBuffer = await this.loadImageBuffer(imageInput);
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      if (!width || !height) {
        throw new Error('Unable to determine avatar dimensions');
      }

      const croppedHeight = Math.max(
        1,
        Math.min(height, Math.round(height * this.TRY_ON_AVATAR_RETAIN_RATIO)),
      );

      if (croppedHeight === height) {
        return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
      }

      this.logger.log(
        `✂️ Cropping avatar for try-on: ${width}x${height} → ${width}x${croppedHeight}`,
      );

      const croppedBuffer = await sharp(imageBuffer)
        .extract({
          left: 0,
          top: 0,
          width,
          height: croppedHeight,
        })
        .jpeg({ quality: 92, mozjpeg: true })
        .toBuffer();

      return `data:image/jpeg;base64,${croppedBuffer.toString('base64')}`;
    } catch (error) {
      this.logger.error(`Failed to crop avatar for try-on: ${error.message}`);
      throw new Error(`Avatar crop failed: ${error.message}`);
    }
  }

  async normalizeToPortraitCanvas(
    imageInput: string,
    options: PortraitCanvasOptions = {},
  ): Promise<string> {
    try {
      const imageBuffer = await this.loadImageBuffer(imageInput);
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      if (!width || !height) {
        throw new Error('Unable to determine image dimensions');
      }

      const {
        targetAspectRatio = this.DEFAULT_PORTRAIT_ASPECT_RATIO,
        maxWidth = this.DEFAULT_PORTRAIT_MAX_WIDTH,
        maxHeight = this.DEFAULT_PORTRAIT_MAX_HEIGHT,
        quality = 90,
        format = 'jpeg',
        backgroundStyle = 'blurred',
        backgroundColor = { r: 255, g: 255, b: 255, alpha: 1 },
      } = options;

      let targetWidth = width;
      let targetHeight = height;
      const currentAspectRatio = width / height;

      if (currentAspectRatio > targetAspectRatio) {
        targetHeight = Math.ceil(width / targetAspectRatio);
      } else if (currentAspectRatio < targetAspectRatio) {
        targetWidth = Math.ceil(height * targetAspectRatio);
      }

      const scale = Math.min(
        1,
        maxWidth / targetWidth,
        maxHeight / targetHeight,
      );

      targetWidth = Math.max(1, Math.round(targetWidth * scale));
      targetHeight = Math.max(1, Math.round(targetHeight * scale));

      this.logger.log(
        `🖼️ Normalizing image to portrait canvas: ${width}x${height} → ${targetWidth}x${targetHeight}`,
      );

      const foregroundBuffer = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();

      let pipeline: sharp.Sharp;

      if (backgroundStyle === 'solid') {
        pipeline = sharp({
          create: {
            width: targetWidth,
            height: targetHeight,
            channels: 4,
            background: {
              r: backgroundColor.r,
              g: backgroundColor.g,
              b: backgroundColor.b,
              alpha: backgroundColor.alpha ?? 1,
            },
          },
        }).composite([
          {
            input: foregroundBuffer,
            gravity: 'center',
          },
        ]);
      } else {
        const backgroundBuffer = await sharp(imageBuffer)
          .resize(targetWidth, targetHeight, {
            fit: 'cover',
          })
          .blur(24)
          .modulate({
            brightness: 1.03,
            saturation: 0.92,
          })
          .jpeg({ quality: 70, mozjpeg: true })
          .toBuffer();

        pipeline = sharp(backgroundBuffer).composite([
          {
            input: foregroundBuffer,
            gravity: 'center',
          },
        ]);
      }

      if (format === 'png') {
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ quality });
      } else {
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      }

      const normalizedBuffer = await pipeline.toBuffer();
      const mimeType =
        format === 'png'
          ? 'image/png'
          : format === 'webp'
            ? 'image/webp'
            : 'image/jpeg';

      return `data:${mimeType};base64,${normalizedBuffer.toString('base64')}`;
    } catch (error) {
      this.logger.error(
        `Failed to normalize portrait canvas: ${error.message}`,
      );
      throw new Error(`Portrait normalization failed: ${error.message}`);
    }
  }

  /**
   * Compare two images after normalizing them to a small RGB buffer.
   * Returns a similarity score between 0 and 1, where 1 means visually identical.
   */
  async calculateVisualSimilarity(
    firstImage: string,
    secondImage: string,
    size: number = 64,
  ): Promise<number> {
    try {
      const [firstBuffer, secondBuffer] = await Promise.all([
        this.loadImageBuffer(firstImage),
        this.loadImageBuffer(secondImage),
      ]);

      const normalize = async (buffer: Buffer) =>
        sharp(buffer)
          .resize(size, size, { fit: 'fill' })
          .removeAlpha()
          .raw()
          .toBuffer();

      const [firstRaw, secondRaw] = await Promise.all([
        normalize(firstBuffer),
        normalize(secondBuffer),
      ]);

      if (firstRaw.length !== secondRaw.length || firstRaw.length === 0) {
        return 0;
      }

      let totalDiff = 0;
      for (let index = 0; index < firstRaw.length; index += 1) {
        totalDiff += Math.abs(firstRaw[index] - secondRaw[index]);
      }

      const maxDiff = firstRaw.length * 255;
      const similarity = 1 - totalDiff / maxDiff;
      return Math.max(0, Math.min(1, similarity));
    } catch (error) {
      this.logger.warn(
        `Failed to calculate visual similarity: ${error.message}`,
      );
      return 0;
    }
  }

  async areImagesVisuallySimilar(
    firstImage: string,
    secondImage: string,
    threshold: number = 0.985,
  ): Promise<boolean> {
    const similarity = await this.calculateVisualSimilarity(
      firstImage,
      secondImage,
    );

    this.logger.log(
      `🧮 Visual similarity score: ${similarity.toFixed(4)} (threshold: ${threshold})`,
    );

    return similarity >= threshold;
  }

  /**
   * Extract metadata from an image
   * @param base64Image - Base64 encoded image
   * @returns Image metadata including dimensions, format, and size
   */
  async extractImageMetadata(base64Image: string): Promise<ImageMetadata> {
    try {
      const base64Data = this.extractBase64Data(base64Image);
      const imageBuffer = Buffer.from(base64Data, 'base64');

      const metadata = await sharp(imageBuffer).metadata();

      const imageMetadata: ImageMetadata = {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: imageBuffer.length,
        hasAlpha: metadata.hasAlpha || false,
      };

      this.logger.log(
        `📊 Image metadata: ${imageMetadata.width}x${imageMetadata.height} ` +
          `${imageMetadata.format}, ${this.formatBytes(imageMetadata.size)}`,
      );

      return imageMetadata;
    } catch (error) {
      this.logger.error(`Failed to extract metadata: ${error.message}`);
      throw new Error(`Metadata extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract dominant colors from an image (useful for background generation)
   * @param base64Image - Base64 encoded image
   * @param numColors - Number of dominant colors to extract, default 3
   * @returns Array of hex color codes
   */
  async extractDominantColors(
    base64Image: string,
    numColors: number = 3,
  ): Promise<string[]> {
    try {
      const base64Data = this.extractBase64Data(base64Image);
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Resize to small size for faster color analysis
      const { data, info } = await sharp(imageBuffer)
        .resize(100, 100, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Simple color quantization (can be enhanced with more sophisticated algorithms)
      const colors = this.quantizeColors(data, info.channels, numColors);

      this.logger.log(
        `🎨 Extracted ${colors.length} dominant colors: ${colors.join(', ')}`,
      );

      return colors;
    } catch (error) {
      this.logger.error(`Failed to extract colors: ${error.message}`);
      return []; // Return empty array on failure
    }
  }

  /**
   * Check if an image needs compression based on size threshold
   * @param base64Image - Base64 encoded image
   * @param maxSizeKB - Maximum size in KB, default 1024 (1MB)
   * @returns True if image should be compressed
   */
  shouldCompress(base64Image: string, maxSizeKB: number = 1024): boolean {
    const base64Data = this.extractBase64Data(base64Image);
    const sizeKB = (base64Data.length * 0.75) / 1024; // Approximate size in KB
    return sizeKB > maxSizeKB;
  }

  /**
   * Extract base64 data from a string (removes data URI prefix if present)
   * @param base64String - Base64 string with or without data URI prefix
   * @returns Pure base64 data
   */
  private extractBase64Data(base64String: string): string {
    if (base64String.startsWith('data:')) {
      const matches = base64String.match(/^data:[^;]+;base64,(.+)$/);
      return matches ? matches[1] : base64String;
    }
    return base64String;
  }

  private async loadImageBuffer(imageInput: string): Promise<Buffer> {
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      const response = await fetch(imageInput);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    }

    return Buffer.from(this.extractBase64Data(imageInput), 'base64');
  }

  /**
   * Simple color quantization algorithm
   * Groups similar colors and returns the most dominant ones
   */
  private quantizeColors(
    data: Buffer,
    channels: number,
    numColors: number,
  ): string[] {
    const colorMap = new Map<string, number>();

    // Sample every 10th pixel to speed up processing
    for (let i = 0; i < data.length; i += channels * 10) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Round to nearest 32 to group similar colors
      const roundedR = Math.round(r / 32) * 32;
      const roundedG = Math.round(g / 32) * 32;
      const roundedB = Math.round(b / 32) * 32;

      const colorKey = `${roundedR},${roundedG},${roundedB}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }

    // Sort by frequency and get top colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, numColors);

    // Convert to hex
    return sortedColors.map(([color]) => {
      const [r, g, b] = color.split(',').map(Number);
      return this.rgbToHex(r, g, b);
    });
  }

  /**
   * Convert RGB to hex color code
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      [r, g, b]
        .map((x) => {
          const hex = x.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
