import { AIServiceException } from '../../exceptions/tryon.exceptions';
import { TryOnErrorCode } from '../../enums/ai-provider.enum';
import {
  GEMINI_AI_TIMEOUT,
  GEMINI_TRYON_CONFIG,
  GEMINI_TRYON_ERROR_MESSAGES,
} from '../../constants/tryon.constants';

export interface GeminiInlineData {
  data: string;
  mimeType: string;
}

const DATA_URI_PREFIX = 'data:';
const BASE64_SEPARATOR = ';base64,';
const DATA_URI_PATTERN = /^data:([^;]+);base64,(.+)$/;
const HTTP_PREFIX = 'http';

const HEADER_KEYS = {
  CONTENT_TYPE: 'content-type',
  ACCEPT: 'accept',
  USER_AGENT: 'user-agent',
} as const;

const DEFAULT_MIME_TYPE_PREFIX = 'image/';
const DEFAULT_ACCEPT_HEADER = 'image/*';
const DEFAULT_USER_AGENT = 'aivestire-tryon/1.0';

export const buildDataUri = (base64Data: string, mimeType: string): string =>
  `${DATA_URI_PREFIX}${mimeType}${BASE64_SEPARATOR}${base64Data}`;

export const extractImageData = async (
  input: string,
  timeoutMs: number = GEMINI_AI_TIMEOUT,
): Promise<GeminiInlineData> => {
  if (input.startsWith(DATA_URI_PREFIX)) {
    const matches = input.match(DATA_URI_PATTERN);
    if (matches) {
      const mimeType = matches[1];
      const data = matches[2];
      return { data, mimeType };
    }
  }

  if (input.startsWith(HTTP_PREFIX)) {
    return fetchImageAsBase64(input, timeoutMs);
  }

  return {
    data: input,
    mimeType: GEMINI_TRYON_CONFIG.DEFAULT_MIME_TYPE,
  };
};

const fetchImageAsBase64 = async (
  url: string,
  timeoutMs: number,
): Promise<GeminiInlineData> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        [HEADER_KEYS.ACCEPT]: DEFAULT_ACCEPT_HEADER,
        [HEADER_KEYS.USER_AGENT]: DEFAULT_USER_AGENT,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AIServiceException(
        TryOnErrorCode.AI_SERVICE_ERROR,
        GEMINI_TRYON_ERROR_MESSAGES.REQUEST_FAILED,
        response.status,
        { statusText: response.statusText },
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get(HEADER_KEYS.CONTENT_TYPE);
    const mimeType = resolveMimeType(contentType);

    return { data: base64Data, mimeType };
  } catch (error) {
    if (error instanceof AIServiceException) {
      throw error;
    }

    throw new AIServiceException(
      TryOnErrorCode.AI_SERVICE_ERROR,
      GEMINI_TRYON_ERROR_MESSAGES.REQUEST_FAILED,
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' },
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

const resolveMimeType = (contentType: string | null): string => {
  if (!contentType) {
    return GEMINI_TRYON_CONFIG.DEFAULT_MIME_TYPE;
  }

  const [mimeType] = contentType.split(';');
  if (!mimeType || !mimeType.startsWith(DEFAULT_MIME_TYPE_PREFIX)) {
    return GEMINI_TRYON_CONFIG.DEFAULT_MIME_TYPE;
  }

  return mimeType;
};
