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
export interface GeminiTryOnPromptAttributes {
  height_cm?: number;
  weight_kg?: number;
  skin_tone?: string;
  gender?: string;
  body_shape?: string;
  body_size?: string;
  age_range?: string;
  hair_style?: string;
}

const formatGeminiPromptAttr = (value: string) => value.replace(/_/g, ' ');

const convertCmToFeetInches = (heightCm: number): string => {
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return `${feet}'${inches}"`;
};

const extractRepresentativeAge = (ageRange?: string): number | undefined => {
  if (!ageRange) {
    return undefined;
  }

  const matches = ageRange.match(/\d+/g);
  if (!matches || matches.length === 0) {
    return undefined;
  }

  return Number(matches[0]);
};

export function buildGeminiTryOnPrompt(
  attributes?: GeminiTryOnPromptAttributes,
): string {
  const age = extractRepresentativeAge(attributes?.age_range);

  const prompt = {
    role: 'virtual try-on assistant',
    inputs: {
      image_1: 'avatar person who must remain the same person in the final output',
      image_2: 'garment image that must be worn by image_1 in the final output',
    },
    person_attributes: {
      ...(attributes?.height_cm
        ? {
            height: convertCmToFeetInches(attributes.height_cm),
            height_cm: attributes.height_cm,
          }
        : {}),
      ...(attributes?.body_shape
        ? { body_shape: formatGeminiPromptAttr(attributes.body_shape) }
        : {}),
      ...(attributes?.skin_tone
        ? { skin_tone: formatGeminiPromptAttr(attributes.skin_tone) }
        : {}),
      ...(age !== undefined ? { age } : {}),
      ...(attributes?.gender
        ? { gender: formatGeminiPromptAttr(attributes.gender) }
        : {}),
      ...(attributes?.body_size
        ? { body_size: formatGeminiPromptAttr(attributes.body_size) }
        : {}),
      ...(attributes?.weight_kg ? { weight_kg: attributes.weight_kg } : {}),
      ...(attributes?.hair_style
        ? { hair_style: formatGeminiPromptAttr(attributes.hair_style) }
        : {}),
    },
    instructions: {
      identity:
        "Image 1 is the avatar person. Preserve that person's exact face features, skin tone, hairline, hairstyle, hair length, hair volume, hair texture, body type, and overall identity exactly. The final result must clearly be the same person from Image 1, not a new person, not the clothing model, and not a blended identity. Keep the same identity from Image 1 without beautifying, reshaping, or simplifying the face or hair. If the source image is cropped, zoomed, or half-body, expand the canvas and reconstruct the missing framing so the complete head, full hair silhouette, and full body are visible naturally. If height is provided in person_attributes, that height is authoritative and must override any apparent proportions from Image 1 or Image 2.",
      clothing:
        "Image 2 is the garment image. Apply the complete visible fashion look from Image 2 faithfully and make the person in Image 1 actually wear it. The garment and allowed styling details from Image 2 must appear naturally worn on the body of Image 1, not floating, not pasted on, and not shown as a separate reference. Keep all garment colors, patterns, textures, trims, embroidery, silhouette, neckline, sleeves, and design details intact. Shoes, ornaments, jewelry, accessories, embellishments, layering, and extra styling details visible in Image 2 are allowed and should remain in the final try-on. Scale and fit the entire look to the real person described in person_attributes, not to the mannequin or model proportions seen in Image 2.",
      output:
        'Full body (head to toe), full head visible with all hair fully in frame, generous headroom above the hair, visible side margin around the hair silhouette, confident standing pose, happy closed-mouth smile, no visible teeth, clean studio background, soft lighting, photorealistic quality.',
    },
    constraints: [
      'Do NOT crop the output',
      'Do NOT crop, trim, cut off, or hide any part of the hair, head, or forehead',
      'Do NOT let the hair, head, or forehead touch the top or side edges of the image',
      'Do NOT zoom in so tightly that the full hair silhouette is not visible',
      'Do NOT distort or change the face',
      'Do NOT change face shape, eye shape, nose, lips, jawline, or hairline',
      'Do NOT shorten, restyle, flatten, tie back, or simplify the hair',
      'Do NOT alter ethnicity or body type',
      'Do NOT confuse the role of Image 1 and Image 2',
      'Do NOT make Image 2 the person identity',
      'Do NOT make Image 1 look like the clothing model from Image 2',
      'Do NOT change the person into someone else or blend the identity with Image 2',
      'Do NOT use the clothing model face, head, skin, or body from Image 2',
      'Do NOT use the mannequin or clothing-model height, leg length, or body proportions from Image 2',
      'Do NOT let Image 2 override the height specified in person_attributes',
      'Do NOT show teeth in the smile',
      'Image 1 must be the wearer and Image 2 must be the worn garment source',
      'Do NOT leave the clothing as a separate product shot, overlay, collage, or unworn reference',
      'Do NOT carry over shoes, ornaments, jewelry, bags, or accessories from Image 1 unless they are also visible in Image 2',
      'Do NOT invent new garments, shoes, ornaments, jewelry, or accessories that are not visible in Image 2',
      'Shoes, ornaments, jewelry, accessories, and extra styling details visible in Image 2 are allowed in the final try-on',
    ],
  };

  return JSON.stringify(prompt, null, 2);
}

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
export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-image-preview';
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
  ENABLED_BY_DEFAULT: false,
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
