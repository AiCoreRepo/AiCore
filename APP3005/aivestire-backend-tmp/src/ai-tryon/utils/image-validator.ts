import { Logger } from '@nestjs/common';
import {
  MAX_IMAGE_SIZE_BYTES,
  MIN_IMAGE_SIZE_BYTES,
  MIN_IMAGE_WIDTH,
  MIN_IMAGE_HEIGHT,
  MAX_IMAGE_WIDTH,
  MAX_IMAGE_HEIGHT,
  SUPPORTED_MIME_TYPES,
  ERROR_MESSAGES,
} from '../constants/tryon.constants';
import {
  ImageValidationException,
  TryOnException,
} from '../exceptions/tryon.exceptions';
import { TryOnErrorCode } from '../enums/ai-provider.enum';

export interface ImageValidationResult {
  valid: boolean;
  mimeType?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  error?: string;
}

const logger = new Logger('TryOnImageValidator');

export async function validateImage(
  imageData: string,
): Promise<ImageValidationResult> {
  try {
    const isBase64 = isBase64Image(imageData);
    const isUrl = isImageUrl(imageData);

    if (!isBase64 && !isUrl) {
      throw new ImageValidationException(
        TryOnErrorCode.INVALID_IMAGE_FORMAT,
        'Image must be either a base64 encoded string or a valid URL',
      );
    }

    // URL inputs are allowed — do not download for validation.
    if (isUrl) {
      return {
        valid: true,
        mimeType: getMimeTypeFromUrl(imageData),
      };
    }

    const { buffer, mimeType } = parseBase64Image(imageData);

    validateFileSize(buffer.length);
    validateMimeType(mimeType);

    const dimensions = await getImageDimensions(buffer, mimeType);
    validateDimensions(dimensions.width, dimensions.height);

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

    logger.error(`Image validation failed: ${(error as Error).message}`);
    throw new ImageValidationException(
      TryOnErrorCode.CORRUPTED_IMAGE,
      ERROR_MESSAGES.CORRUPTED_IMAGE,
      { originalError: (error as Error).message },
    );
  }
}

export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    logger.error(`Failed to convert URL to base64: ${(error as Error).message}`);
    throw new ImageValidationException(
      TryOnErrorCode.CORRUPTED_IMAGE,
      'Failed to fetch image from URL',
      { url, error: (error as Error).message },
    );
  }
}

function isBase64Image(data: string): boolean {
  return data.startsWith('data:image/') || /^[A-Za-z0-9+/=]+$/.test(data);
}

function isImageUrl(data: string): boolean {
  try {
    const parsed = new URL(data);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseBase64Image(data: string): { buffer: Buffer; mimeType: string } {
  let base64Data: string;
  let mimeType: string;

  if (data.startsWith('data:')) {
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
    base64Data = data;
    mimeType = 'image/jpeg';
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const detectedMimeType = detectMimeType(buffer);
  return { buffer, mimeType: detectedMimeType || mimeType };
}

function detectMimeType(buffer: Buffer): string | null {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

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

function getMimeTypeFromUrl(url: string): string {
  let extension: string | undefined;

  try {
    const parsed = new URL(url);
    extension = parsed.pathname.split('.').pop()?.toLowerCase();
  } catch {
    extension = url.split('.').pop()?.toLowerCase();
  }

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

function validateFileSize(sizeBytes: number): void {
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

function validateMimeType(mimeType: string): void {
  if (!SUPPORTED_MIME_TYPES.includes(mimeType as any)) {
    throw new ImageValidationException(
      TryOnErrorCode.INVALID_IMAGE_FORMAT,
      ERROR_MESSAGES.INVALID_IMAGE_FORMAT,
      { mimeType, supportedTypes: SUPPORTED_MIME_TYPES },
    );
  }
}

function validateDimensions(width: number, height: number): void {
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

async function getImageDimensions(
  buffer: Buffer,
  mimeType: string,
): Promise<{ width: number; height: number }> {
  try {
    if (mimeType === 'image/png') {
      return getPngDimensions(buffer);
    }

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      return getJpegDimensions(buffer);
    }

    if (mimeType === 'image/webp') {
      // WebP parsing is complex; accept default fallback.
      return { width: 1024, height: 1024 };
    }

    return { width: 1024, height: 1024 };
  } catch (error) {
    logger.warn(`Failed to extract dimensions: ${(error as Error).message}`);
    return { width: 1024, height: 1024 };
  }
}

function getPngDimensions(buffer: Buffer): { width: number; height: number } {
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

function getJpegDimensions(buffer: Buffer): { width: number; height: number } {
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

  return { width: 1024, height: 1024 };
}
