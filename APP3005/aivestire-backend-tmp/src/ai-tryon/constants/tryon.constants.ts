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

const getEnvPositiveInt = (key: string, fallback: number): number => {
  const rawValue = process.env[key];
  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
};

const getEnvTimeout = (key: string, fallback: number): number =>
  getEnvPositiveInt(key, fallback);

const getEnvImageFormat = (
  key: string,
  fallback: 'jpeg' | 'png' | 'webp',
): 'jpeg' | 'png' | 'webp' => {
  const rawValue = (process.env[key] || '').trim().toLowerCase();

  if (rawValue === 'jpeg' || rawValue === 'png' || rawValue === 'webp') {
    return rawValue;
  }

  return fallback;
};

// API Timeout Settings (in milliseconds)
export const DEFAULT_TIMEOUT = getEnvTimeout('DEFAULT_TIMEOUT', 60000); // 60 seconds
export const VERTEX_AI_TIMEOUT = getEnvTimeout('VERTEX_AI_TIMEOUT', 120000); // 120 seconds

// Gemini Try-On Timeout
// Production Gemini image generations can exceed 120s under load, especially with complex garments.
// Keep a slightly longer per-attempt timeout, but still below the overall Bull job timeout.
export const GEMINI_AI_TIMEOUT = getEnvTimeout('GEMINI_AI_TIMEOUT', 150000); // 150 seconds
export const GEMINI_AI_TOTAL_BUDGET = getEnvTimeout(
  'GEMINI_AI_TOTAL_BUDGET',
  170000,
); // 170 seconds total across validation/retry loop
export const GEMINI_TRYON_INPUT_MAX_DIMENSION = getEnvPositiveInt(
  'GEMINI_TRYON_INPUT_MAX_DIMENSION',
  768,
);
export const GEMINI_TRYON_INPUT_QUALITY = getEnvPositiveInt(
  'GEMINI_TRYON_INPUT_QUALITY',
  72,
);
export const GEMINI_TRYON_INPUT_FORMAT = getEnvImageFormat(
  'GEMINI_TRYON_INPUT_FORMAT',
  'webp',
);
export const AURA_GEMINI_TIMEOUT = getEnvTimeout(
  'AURA_GEMINI_TIMEOUT',
  90000,
); // 90 seconds

// Hard fail-safe timeouts for Bull job processing.
// These are used as the `timeout` option in queue.add() to hard-kill stalled jobs.
export const AURA_JOB_TIMEOUT = getEnvTimeout('AURA_JOB_TIMEOUT', 180000); // 180s job timeout
export const TRYON_JOB_TIMEOUT = getEnvTimeout('TRYON_JOB_TIMEOUT', 180000); // 180s job timeout

// Retry Configuration
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000; // Initial delay
export const RETRY_BACKOFF_MULTIPLIER = 2; // Exponential backoff

// Processing Limits
export const MAX_CONCURRENT_REQUESTS = 5;
export const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
export const MAX_REQUESTS_PER_WINDOW = 20;
export const AURA_WORKER_CONCURRENCY = getEnvPositiveInt(
  'AURA_WORKER_CONCURRENCY',
  2,
);
export const TRYON_WORKER_CONCURRENCY = getEnvPositiveInt(
  'TRYON_WORKER_CONCURRENCY',
  2,
);

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
    'The third image is an identical duplicate of the real person/avatar, supplied only as a strong identity anchor.',
    'Take the garment from the first image and make the person from the second image actually wear it.',
    personProfileSection,
    'Identity requirements:',
    '- Preserve the exact same face, skin tone, hairline, hairstyle, hair length, hair volume, hair texture, and body proportions of the second image.',
    '- Treat the second and third images as the authoritative and identical wearer references. Copy facial geometry and body proportions from them, not from the garment image.',
    '- Keep the second-image person as the only person in the result.',
    '- ABSOLUTELY DO NOT use the face, head, or identity from the first image (garment reference). If you can see a human face or head in the first image, IGNORE it completely.',
    '- Do not replace, beautify, reshape, or blend the second-image face or body with the clothing-model or mannequin identity from the first image.',
    '- If the second image is cropped or not full body, extend the framing naturally so the same person remains visible head to toe.',
    '- If height is provided in the second-image person profile, use it as the fit reference for body proportions.',
    '- Maintain natural human anatomy and realistic proportions, including a correct head-to-body ratio, centered neck placement, aligned shoulders, and proportional torso, arms, hands, legs, and feet.',
    'Garment requirements:',
    '- Transfer the full visible outfit from the first image onto the second-image person.',
    '- We only want the clothing from the first image. The ONLY face and body identity that should appear is the exact face of the second image.',
    '- Keep garment colors, prints, textures, trims, embroidery, silhouette, neckline, sleeves, layering, shoes, jewelry, and accessories that are visible in the first image.',
    '- The clothing must look naturally worn by the second-image person, not pasted on, floating, overlaid, or shown as a separate product shot.',
    '- Fit and scale the outfit to the real second-image person, not to the mannequin or model proportions visible in the first image.',
    'Output requirements:',
    '- Return a single newly generated full-body image from head to toe.',
    '- Use a vertical portrait composition, approximately 2:3, never a wide cinematic or landscape frame.',
    '- The person should occupy most of the frame height naturally and must not appear tiny inside a large empty background.',
    '- Keep the full head, full hair silhouette, arms, hands, legs, and feet in frame with comfortable margins.',
    '- Use a clean studio background, natural lighting, and photorealistic quality.',
    '- The final image must clearly show that the second-image person is wearing the first-image garment.',
    'Hard negatives:',
    '- Do not return either input image unchanged.',
    '- Do not return the second image with only tiny edits while leaving the original outfit in place.',
    '- Do not create a collage, side-by-side panel, before/after layout, or multiple people.',
    '- Do not crop the head, hair, forehead, arms, hands, legs, or feet.',
    '- Do not output a horizontal, panoramic, or ultra-wide composition.',
    '- Do not make the person look shrunken, distant, or vertically compressed inside the frame.',
    '- Do not invent a different outfit from the one visible in the first image.',
    '- Do not stretch, squeeze, elongate, shrink, warp, or tilt the face, head, neck, shoulders, torso, arms, hands, hips, legs, or feet.',
    '- Do not generate an oversized face, undersized face, floating face, mismatched face-to-body scale, merged limbs, duplicated limbs, or broken anatomy.',
  ].join('\n');
}

export function buildGeminiGarmentContext(audience?: unknown): string {
  const normalizedAudience =
    typeof audience === 'string' ? audience.trim().toLowerCase() : '';
  if (normalizedAudience !== 'male' && normalizedAudience !== 'female') {
    return '';
  }

  return [
    '',
    'Garment collection context:',
    `- The first image is an outfit reference from the ${normalizedAudience} collection.`,
    '- This collection label describes only the garment. It must never replace or alter the wearer identity, face, body, skin tone, or gender shown in the second and third images.',
    '- Fit the referenced garment naturally to the real wearer while keeping that wearer unchanged.',
  ].join('\n');
}

export function buildGeminiGuestTryOnPrompt(): string {
  return [
    'Create one photorealistic full-body fashion preview.',
    'The first image is the outfit reference. The second image is the wearer reference.',
    'Show the wearer from the second image naturally wearing the complete outfit from the first image.',
    'Keep the wearer recognizable with the same facial appearance, hairstyle, skin tone, and natural proportions shown in the second image.',
    'Use the first image only to understand the clothing. Do not use the catalog model as the wearer.',
    'Preserve the outfit colors, fabric, pattern, silhouette, sleeves, trousers or lower garment, footwear, and visible accessories.',
    'Show one person from head to toe in a vertical 2:3 composition with comfortable margins and a clean background.',
    'Return one newly rendered image only, without a collage, comparison panel, text, or watermark.',
  ].join('\n');
}

export const GEMINI_AI_TRYON_PROMPT_STRICT_SUFFIX = `

STRICT OUTPUT RULES:
- Return exactly one newly generated try-on image.
- The first image is the garment source and the second image is the wearer identity.
- The third image duplicates the wearer identity to reinforce the exact face and body reference.
- The output person MUST be the distinct second-image Aura wearer, never the catalog model from the first image.
- Preserve the wearer’s facial geometry, eyes, eyebrows, nose, lips, jaw, ears, skin tone, hair, shoulder width, torso length, waist, hips, arm length, leg length, and overall body proportions from the second and third images.
- Use the first image only for its clothing; discard its face, hair, skin, body, pose, and identity.
- Show the Aura wearer completely from the top of the hair to the soles of both feet with comfortable margin on every side.
- Use a vertical portrait frame and never crop, zoom into, or cut off any part of the wearer.
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
export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-image'; // Canonical Gemini 3.1 image model
export const DEFAULT_VERTEX_LOCATION = 'asia-south1';

// Direct Gemini Try-On Defaults — always use Gemini 3.1 Flash Image
export const GEMINI_TRYON_CONFIG = {
  DEFAULT_MODEL: DEFAULT_GEMINI_MODEL,
  DEFAULT_MIME_TYPE: 'image/jpeg',
} as const;

export const GEMINI_TRYON_OUTPUT_VALIDATION = {
  MAX_LANDSCAPE_RATIO: 1.2,
  MIN_FULL_BODY_PORTRAIT_RATIO: 1.35,
  MAX_AVATAR_SIMILARITY: 0.985,
  MAX_CLOTHING_SIMILARITY: 0.93,
} as const;

export const GEMINI_CLOTHING_MODEL_MASK = {
  ENABLED_BY_DEFAULT: true,
  TOP_REGION_RATIO: 0.3,
  BLUR_SIGMA: 24,
  PIXEL_BLOCK_SIZE: 20,
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
