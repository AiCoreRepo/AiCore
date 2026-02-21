/**
 * Virtual Try-On Service Constants
 * Centralized configuration for image validation, processing, and AI service limits
 */

// Image Size Constraints
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const MIN_IMAGE_SIZE_BYTES = 1024; // 1KB minimum

// Image Dimension Constraints
export const MIN_IMAGE_WIDTH = 256;
export const MIN_IMAGE_HEIGHT = 256;
export const MAX_IMAGE_WIDTH = 4096;
export const MAX_IMAGE_HEIGHT = 4096;

// Optimal dimensions for AI processing
export const OPTIMAL_IMAGE_WIDTH = 1024;
export const OPTIMAL_IMAGE_HEIGHT = 1024;

// Supported MIME Types
export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

// Supported File Extensions
export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

// API Timeout Settings (in milliseconds)
export const DEFAULT_TIMEOUT = 60000; // 60 seconds
export const VERTEX_AI_TIMEOUT = 90000; // 90 seconds
export const GEMINI_AI_TIMEOUT = 300000; // 300 seconds (5 minutes) - increased further for slow generation

// Retry Configuration
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000; // Initial delay
export const RETRY_BACKOFF_MULTIPLIER = 2; // Exponential backoff

// Processing Limits
export const MAX_CONCURRENT_REQUESTS = 5;
export const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
export const MAX_REQUESTS_PER_WINDOW = 20;

// Cache Settings
export const CACHE_TTL_SECONDS = 3600; // 1 hour
export const ENABLE_CACHING = false; // Disabled by default

// Image Quality Settings
export const JPEG_QUALITY = 90;
export const PNG_COMPRESSION_LEVEL = 6;
export const WEBP_QUALITY = 90;

// AI Model Prompts
export const VERTEX_AI_TRYON_PROMPT = `Generate a realistic virtual try-on image where the person in the avatar image is wearing the clothing item from the product image. 
Maintain the person's pose, body proportions, and facial features exactly as they appear. 
Ensure the clothing fits naturally and realistically on the person's body, adapting to their shape and posture. 
Preserve the original style, color, texture, and all details of the clothing item. 
The output should be photorealistic, seamless, and look like a professional product photograph. 
Pay special attention to lighting consistency, shadows, and fabric draping for maximum realism.`;

export const GEMINI_AI_TRYON_PROMPT = `You are an expert virtual try-on system with advanced understanding of fashion, body proportions, and photorealistic image composition.

TASK: Create a photorealistic composite image where the person from the avatar image is wearing the clothing item from the product image.

CRITICAL REQUIREMENTS:
1. IDENTITY PRESERVATION: Maintain the person's exact facial features, skin tone, hair, and overall appearance
2. BODY ACCURACY: Preserve the person's body shape, proportions, pose, and stance
3. CLOTHING FIDELITY: Accurately represent the clothing's color, texture, pattern, style, and all design details
4. REALISTIC FIT: Ensure the clothing fits naturally on the person's body with proper draping and fabric physics
5. LIGHTING CONSISTENCY: Match lighting, shadows, and highlights between the person and clothing for seamless integration
6. PROFESSIONAL QUALITY: Output should be indistinguishable from a professional fashion photograph

TECHNICAL SPECIFICATIONS:
- Maintain high resolution and image quality
- Ensure proper perspective and scale
- Create realistic fabric wrinkles and folds
- Add appropriate shadows and reflections
- Blend edges seamlessly for natural integration

OUTPUT: A single, high-quality, photorealistic image of the person wearing the clothing item.`;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_IMAGE_FORMAT:
    'Invalid image format. Supported formats: JPEG, PNG, WEBP',
  IMAGE_TOO_LARGE: `Image size exceeds maximum limit of ${MAX_IMAGE_SIZE_MB}MB`,
  IMAGE_TOO_SMALL: 'Image size is too small. Minimum size is 1KB',
  INVALID_DIMENSIONS: `Image dimensions must be between ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT} and ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}`,
  CORRUPTED_IMAGE: 'Image file is corrupted or cannot be processed',
  MISSING_AVATAR: 'Avatar image is required',
  MISSING_CLOTHING: 'Clothing image is required',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later',
  SERVICE_UNAVAILABLE: 'AI service is temporarily unavailable',
  TIMEOUT: 'Request timeout. Please try again',
  PROCESSING_FAILED: 'Failed to process try-on request',
  INVALID_PROVIDER: 'Invalid AI provider specified',
  MISSING_API_KEY: 'AI service API key is not configured',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TRYON_COMPLETED: 'Virtual try-on completed successfully',
  IMAGE_VALIDATED: 'Image validation passed',
  PROCESSING_STARTED: 'Try-on processing started',
} as const;

// Service Configuration Keys
export const CONFIG_KEYS = {
  VERTEX_AI_PROJECT_ID: 'VERTEX_AI_PROJECT_ID',
  VERTEX_AI_LOCATION: 'VERTEX_AI_LOCATION',
  VERTEX_AI_MODEL: 'VERTEX_AI_MODEL',
  GOOGLE_APPLICATION_CREDENTIALS: 'GOOGLE_APPLICATION_CREDENTIALS',
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  GEMINI_MODEL: 'GEMINI_MODEL',
} as const;

// Default Model Names (can be overridden via environment variables)
export const DEFAULT_VERTEX_MODEL = 'imagegeneration@006';
export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-pro';
export const DEFAULT_VERTEX_LOCATION = 'us-central1';
