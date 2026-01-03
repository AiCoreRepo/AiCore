import { Injectable, Logger } from '@nestjs/common';
import { ImageType, SupportedImageFormat } from '../../enums/ai-provider.enum';
import { ImageValidationException, TryOnException } from '../../exceptions/tryon.exceptions';
import { TryOnErrorCode } from '../../enums/ai-provider.enum';
import {
    MAX_IMAGE_SIZE_BYTES,
    MIN_IMAGE_SIZE_BYTES,
    MIN_IMAGE_WIDTH,
    MIN_IMAGE_HEIGHT,
    MAX_IMAGE_WIDTH,
    MAX_IMAGE_HEIGHT,
    SUPPORTED_MIME_TYPES,
    ERROR_MESSAGES,
} from '../../constants/tryon.constants';

export interface ImageValidationResult {
    valid: boolean;
    mimeType?: string;
    width?: number;
    height?: number;
    sizeBytes?: number;
    error?: string;
}

@Injectable()
export class ImageValidatorService {
    private readonly logger = new Logger(ImageValidatorService.name);

    /**
     * Validate image from base64 string or URL
     */
    async validateImage(imageData: string): Promise<ImageValidationResult> {
        try {
            // Check if it's a base64 string or URL
            const isBase64 = this.isBase64Image(imageData);
            const isUrl = this.isImageUrl(imageData);

            if (!isBase64 && !isUrl) {
                throw new ImageValidationException(
                    TryOnErrorCode.INVALID_IMAGE_FORMAT,
                    'Image must be either a base64 encoded string or a valid URL',
                );
            }

            let buffer: Buffer;
            let mimeType: string;

            if (isBase64) {
                const result = this.parseBase64Image(imageData);
                buffer = result.buffer;
                mimeType = result.mimeType;
            } else {
                // For URLs, we'll validate format but not download
                mimeType = this.getMimeTypeFromUrl(imageData);
                return {
                    valid: true,
                    mimeType,
                };
            }

            // Validate file size
            this.validateFileSize(buffer.length);

            // Validate MIME type
            this.validateMimeType(mimeType);

            // Get image dimensions (basic validation)
            const dimensions = await this.getImageDimensions(buffer, mimeType);

            // Validate dimensions
            this.validateDimensions(dimensions.width, dimensions.height);

            return {
                valid: true,
                mimeType,
                width: dimensions.width,
                height: dimensions.height,
                sizeBytes: buffer.length,
            };
        } catch (error) {
            if (error instanceof TryOnException) {
                throw error;
            }
            this.logger.error(`Image validation failed: ${error.message}`);
            throw new ImageValidationException(
                TryOnErrorCode.CORRUPTED_IMAGE,
                ERROR_MESSAGES.CORRUPTED_IMAGE,
                { originalError: error.message },
            );
        }
    }

    /**
     * Check if string is a base64 encoded image
     */
    private isBase64Image(data: string): boolean {
        return data.startsWith('data:image/') || /^[A-Za-z0-9+/=]+$/.test(data);
    }

    /**
     * Check if string is an image URL
     */
    private isImageUrl(data: string): boolean {
        try {
            const url = new URL(data);
            return (
                (url.protocol === 'http:' || url.protocol === 'https:') &&
                /\.(jpg|jpeg|png|webp)$/i.test(url.pathname)
            );
        } catch {
            return false;
        }
    }

    /**
     * Parse base64 image and extract buffer and MIME type
     */
    private parseBase64Image(data: string): {
        buffer: Buffer;
        mimeType: string;
    } {
        let base64Data: string;
        let mimeType: string;

        if (data.startsWith('data:')) {
            // Extract MIME type and base64 data
            const matches = data.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
                throw new ImageValidationException(
                    TryOnErrorCode.INVALID_IMAGE_FORMAT,
                    'Invalid base64 image format',
                );
            }
            mimeType = matches[1];
            base64Data = matches[2];
        } else {
            // Assume raw base64 without data URI prefix
            base64Data = data;
            mimeType = 'image/jpeg'; // Default to JPEG
        }

        try {
            const buffer = Buffer.from(base64Data, 'base64');
            // Detect actual MIME type from buffer if not specified
            const detectedMimeType = this.detectMimeType(buffer);
            return {
                buffer,
                mimeType: detectedMimeType || mimeType,
            };
        } catch (error) {
            throw new ImageValidationException(
                TryOnErrorCode.INVALID_IMAGE_FORMAT,
                'Failed to decode base64 image',
            );
        }
    }

    /**
     * Detect MIME type from buffer magic numbers
     */
    private detectMimeType(buffer: Buffer): string | null {
        // JPEG magic numbers
        if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
            return 'image/jpeg';
        }
        // PNG magic numbers
        if (
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4e &&
            buffer[3] === 0x47
        ) {
            return 'image/png';
        }
        // WebP magic numbers
        if (
            buffer[8] === 0x57 &&
            buffer[9] === 0x45 &&
            buffer[10] === 0x42 &&
            buffer[11] === 0x50
        ) {
            return 'image/webp';
        }
        return null;
    }

    /**
     * Get MIME type from URL extension
     */
    private getMimeTypeFromUrl(url: string): string {
        const extension = url.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'webp':
                return 'image/webp';
            default:
                return 'image/jpeg';
        }
    }

    /**
     * Validate file size
     */
    private validateFileSize(sizeBytes: number): void {
        if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
            throw new ImageValidationException(
                TryOnErrorCode.IMAGE_TOO_LARGE,
                ERROR_MESSAGES.IMAGE_TOO_LARGE,
                { sizeBytes, maxSizeBytes: MAX_IMAGE_SIZE_BYTES },
            );
        }

        if (sizeBytes < MIN_IMAGE_SIZE_BYTES) {
            throw new ImageValidationException(
                TryOnErrorCode.IMAGE_TOO_SMALL,
                ERROR_MESSAGES.IMAGE_TOO_SMALL,
                { sizeBytes, minSizeBytes: MIN_IMAGE_SIZE_BYTES },
            );
        }
    }

    /**
     * Validate MIME type
     */
    private validateMimeType(mimeType: string): void {
        if (!SUPPORTED_MIME_TYPES.includes(mimeType as any)) {
            throw new ImageValidationException(
                TryOnErrorCode.INVALID_IMAGE_FORMAT,
                ERROR_MESSAGES.INVALID_IMAGE_FORMAT,
                { mimeType, supportedTypes: SUPPORTED_MIME_TYPES },
            );
        }
    }

    /**
     * Validate image dimensions
     */
    private validateDimensions(width: number, height: number): void {
        if (
            width < MIN_IMAGE_WIDTH ||
            height < MIN_IMAGE_HEIGHT ||
            width > MAX_IMAGE_WIDTH ||
            height > MAX_IMAGE_HEIGHT
        ) {
            throw new ImageValidationException(
                TryOnErrorCode.INVALID_DIMENSIONS,
                ERROR_MESSAGES.INVALID_DIMENSIONS,
                {
                    width,
                    height,
                    minWidth: MIN_IMAGE_WIDTH,
                    minHeight: MIN_IMAGE_HEIGHT,
                    maxWidth: MAX_IMAGE_WIDTH,
                    maxHeight: MAX_IMAGE_HEIGHT,
                },
            );
        }
    }

    /**
     * Get image dimensions from buffer
     * This is a basic implementation - for production, use a library like 'sharp' or 'image-size'
     */
    private async getImageDimensions(
        buffer: Buffer,
        mimeType: string,
    ): Promise<{ width: number; height: number }> {
        try {
            if (mimeType === 'image/png') {
                return this.getPngDimensions(buffer);
            } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
                return this.getJpegDimensions(buffer);
            } else if (mimeType === 'image/webp') {
                // WebP dimension extraction is complex, return default for now
                return { width: 1024, height: 1024 };
            }
            return { width: 1024, height: 1024 }; // Default
        } catch (error) {
            this.logger.warn(`Failed to extract dimensions: ${error.message}`);
            return { width: 1024, height: 1024 }; // Default fallback
        }
    }

    /**
     * Extract PNG dimensions from buffer
     */
    private getPngDimensions(buffer: Buffer): { width: number; height: number } {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
    }

    /**
     * Extract JPEG dimensions from buffer
     */
    private getJpegDimensions(buffer: Buffer): { width: number; height: number } {
        let offset = 2;
        while (offset < buffer.length) {
            if (buffer[offset] !== 0xff) break;

            const marker = buffer[offset + 1];
            if (marker === 0xc0 || marker === 0xc2) {
                const height = buffer.readUInt16BE(offset + 5);
                const width = buffer.readUInt16BE(offset + 7);
                return { width, height };
            }

            const segmentLength = buffer.readUInt16BE(offset + 2);
            offset += segmentLength + 2;
        }

        return { width: 1024, height: 1024 }; // Default if parsing fails
    }

    /**
     * Convert image URL to base64
     */
    async urlToBase64(url: string): Promise<string> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            const mimeType = response.headers.get('content-type') || 'image/jpeg';
            return `data:${mimeType};base64,${buffer.toString('base64')}`;
        } catch (error) {
            this.logger.error(`Failed to convert URL to base64: ${error.message}`);
            throw new ImageValidationException(
                TryOnErrorCode.CORRUPTED_IMAGE,
                'Failed to fetch image from URL',
                { url, error: error.message },
            );
        }
    }
}
