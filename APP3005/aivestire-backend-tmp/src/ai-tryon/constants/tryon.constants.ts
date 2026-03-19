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

const buildGeminiPersonProfile = (
  attributes?: GeminiTryOnPromptAttributes,
): string[] => {
  const age = extractRepresentativeAge(attributes?.age_range);
  const profileLines: string[] = [];

  if (attributes?.height_cm) {
    profileLines.push(
      `Height: ${attributes.height_cm} cm (${convertCmToFeetInches(attributes.height_cm)})`,
    );
  }

  if (attributes?.body_shape) {
    profileLines.push(
      `Body shape: ${formatGeminiPromptAttr(attributes.body_shape)}`,
    );
  }

  if (attributes?.body_size) {
    profileLines.push(
      `Body size: ${formatGeminiPromptAttr(attributes.body_size)}`,
    );
  }

  if (attributes?.weight_kg) {
    profileLines.push(`Weight: ${attributes.weight_kg} kg`);
  }

  if (attributes?.skin_tone) {
    profileLines.push(
      `Skin tone: ${formatGeminiPromptAttr(attributes.skin_tone)}`,
    );
  }

  if (attributes?.gender) {
    profileLines.push(`Gender: ${formatGeminiPromptAttr(attributes.gender)}`);
  }

  if (age !== undefined) {
    profileLines.push(`Approximate age: ${age}`);
  }

  if (attributes?.hair_style) {
    profileLines.push(
      `Hair style: ${formatGeminiPromptAttr(attributes.hair_style)}`,
    );
  }

  return profileLines;
};

export function buildGeminiTryOnPrompt(
  attributes?: GeminiTryOnPromptAttributes,
): string {
  const personProfileLines = buildGeminiPersonProfile(attributes);
  const personProfileSection = personProfileLines.length
    ? [
        'Second-image person profile:',
        ...personProfileLines.map((line) => `- ${line}`),
      ].join('\n')
    : 'No extra profile is provided beyond the second image. Preserve the real identity and body proportions visible in the second image.';

  return [
    'Create exactly one new photorealistic virtual try-on image.',
    'The first image is the garment or outfit reference.',
    'The second image is the real person/avatar whose identity must remain unchanged in the final result.',
    'Take the garment from the first image and make the person from the second image actually wear it.',
    personProfileSection,
    'Identity requirements:',
    '- Preserve the exact same face, skin tone, hairline, hairstyle, hair length, hair volume, hair texture, and body proportions of the second image.',
    '- Keep the second-image person as the only person in the result.',
    '- Do not replace, beautify, reshape, or blend the second-image face or body with the clothing-model or mannequin identity from the first image.',
    '- If the second image is cropped or not full body, extend the framing naturally so the same person remains visible head to toe.',
    '- If height is provided in the second-image person profile, use it as the fit reference for body proportions.',
    'Garment requirements:',
    '- Transfer the full visible outfit from the first image onto the second-image person.',
    '- Keep garment colors, prints, textures, trims, embroidery, silhouette, neckline, sleeves, layering, shoes, jewelry, and accessories that are visible in the first image.',
    '- The clothing must look naturally worn by the second-image person, not pasted on, floating, overlaid, or shown as a separate product shot.',
    '- Fit and scale the outfit to the real second-image person, not to the mannequin or model proportions visible in the first image.',
    'Output requirements:',
    '- Return a single newly generated full-body image from head to toe.',
    '- Keep the full head, full hair silhouette, arms, hands, legs, and feet in frame with comfortable margins.',
    '- Use a clean studio background, natural lighting, and photorealistic quality.',
    '- The final image must clearly show that the second-image person is wearing the first-image garment.',
    'Hard negatives:',
    '- Do not return either input image unchanged.',
    '- Do not return the second image with only tiny edits while leaving the original outfit in place.',
    '- Do not create a collage, side-by-side panel, before/after layout, or multiple people.',
    '- Do not crop the head, hair, forehead, arms, hands, legs, or feet.',
    '- Do not invent a different outfit from the one visible in the first image.',
  ].join('\n');
}

export const GEMINI_AI_TRYON_PROMPT_STRICT_SUFFIX = `

STRICT OUTPUT RULES:
- Return exactly one newly generated try-on image.
- The first image is the garment source and the second image is the wearer identity.
- NEVER return either input image unchanged.
- NEVER output collages, panels, product sheets, or multiple images in one frame.
- If unsure, still generate a new image where the second-image person is clearly wearing the first-image garment.`;

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
  MAX_AVATAR_SIMILARITY: 0.985,
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
  OUTPUT_MATCH_RETRY_FAILED:
    'Gemini try-on output did not change after retries',
  OUTPUT_NOT_GENERATED:
    'Gemini did not generate a new try-on image. Please try again with a different clothing image.',
} as const;
