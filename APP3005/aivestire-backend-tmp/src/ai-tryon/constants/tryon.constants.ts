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
// export const VERTEX_AI_TRYON_PROMPT = `Generate a realistic virtual try-on image where the person in the avatar image is wearing the clothing item from the product image. 
// Maintain the person's pose, body proportions, and facial features exactly as they appear. 
// Ensure the clothing fits naturally and realistically on the person's body, adapting to their shape and posture. 
// Preserve the original style, color, texture, and all details of the clothing item. 
// The output should be photorealistic, seamless, and look like a professional product photograph. 
// Pay special attention to lighting consistency, shadows, and fabric draping for maximum realism.`;

export const GEMINI_AI_TRYON_PROMPT = `You are a world-class virtual try-on system. 

GOAL:
Generate ONE photorealistic output image where the PERSON in the avatar image is wearing the CLOTHING item from the product image.

INPUT ORDER:
1) First image = the avatar/person.
2) Second image = the clothing item.

IDENTITY & BODY (MUST PRESERVE):
- Keep the exact face, skin tone, hair, and identity from the avatar.
- Keep the same body proportions, pose, and posture from the avatar.
- Do NOT alter facial features or body shape.
- Do NOT use the clothing model's face, head, skin, or body.

CLOTHING FIDELITY (MUST MATCH):
- Copy the clothing item exactly: color, texture, pattern, fabric, silhouette, neckline, sleeves, and all design details.
- Do NOT invent new designs or change branding/logo placement.
- Keep the clothing item realistic in size and scale relative to the body.
- If the clothing image contains a model, ignore that model completely (only use the garment).

REALISM & PHOTOGRAPHY:
- Ensure natural fit and drape; add realistic wrinkles and folds.
- Match lighting, shadows, and highlights so the clothing blends seamlessly.
- Preserve the original background from the avatar image (do not replace).
- Avoid artifacts, warping, or unnatural edges around the garment.
- Keep the full person visible (head-to-toe) and preserve the avatar's original framing.
- Do not crop, zoom, or cut off any body parts.

OUTPUT:
- Return a single high-resolution, photorealistic image of the avatar wearing the clothing item.
- Do NOT return the input images or side-by-side comparisons.`;

export const GEMINI_AI_TRYON_PROMPT_STRICT_SUFFIX = `

STRICT OUTPUT RULES:
- Return ONLY the final try-on image.
- NEVER return or repeat any input image.
- NEVER output collages, panels, or multiple images in one frame.
- If unsure, still generate a new try-on image that preserves the avatar identity.`;

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

// Direct Gemini Try-On Defaults
export const GEMINI_TRYON_CONFIG = {
  DEFAULT_MODEL: 'gemini-3.1-flash-image-preview',
  DEFAULT_MIME_TYPE: 'image/jpeg',
} as const;

export const GEMINI_TRYON_OUTPUT_VALIDATION = {
  MAX_LANDSCAPE_RATIO: 1.2,
  OUTPUT_MATCH_RETRY_LIMIT: 3,
} as const;

export const GEMINI_CLOTHING_MODEL_MASK = {
  ENABLED_BY_DEFAULT: true,
  TOP_REGION_RATIO: 0.18,
  BLUR_SIGMA: 12,
} as const;

export const GEMINI_TRYON_ERROR_MESSAGES = {
  MISSING_API_KEY: 'Gemini API key is not configured',
  REQUEST_FAILED: 'Gemini try-on request failed',
  INVALID_RESPONSE: 'Gemini try-on returned an invalid response',
  NO_IMAGE_DATA: 'Gemini try-on response did not include image data',
  REQUEST_TIMEOUT: 'Gemini try-on request timed out',
  OUTPUT_MATCHES_INPUT: 'Gemini try-on output matched an input image',
  OUTPUT_MATCH_RETRY_FAILED: 'Gemini try-on output did not change after retries',
  OUTPUT_NOT_GENERATED:
    'Gemini did not generate a new try-on image. Please try again with a different clothing image.',
} as const;
