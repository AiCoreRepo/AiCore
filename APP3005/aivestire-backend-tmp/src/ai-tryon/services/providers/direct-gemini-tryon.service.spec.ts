import sharp from 'sharp';
import { ConfigService } from '@nestjs/config';
import { DirectGeminiTryOnService } from './direct-gemini-tryon.service';
import { ImageValidatorService } from '../common/image-validator.service';
import { ImageOptimizerService } from '../../../common/image-optimizer.service';
import { TryOnErrorCode } from '../../enums/ai-provider.enum';

const generateContentMock = jest.fn();
const generateContentStreamMock = jest.fn();
const getGenerativeModelMock = jest.fn(() => ({
  generateContent: generateContentMock,
  generateContentStream: generateContentStreamMock,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: getGenerativeModelMock,
  })),
}));

describe('DirectGeminiTryOnService', () => {
  const createImageBase64 = async (rgb: {
    r: number;
    g: number;
    b: number;
  }): Promise<string> => {
    const buffer = await sharp({
      create: {
        width: 128,
        height: 192,
        channels: 3,
        background: rgb,
      },
    })
      .png()
      .toBuffer();

    return buffer.toString('base64');
  };

  const createService = () => {
    const imageValidator = {
      validateImage: jest.fn().mockResolvedValue({ valid: true }),
      urlToBase64: jest.fn(async (url: string) => {
        const encoded = Buffer.from(url).toString('base64');
        return `data:image/jpeg;base64,${encoded}`;
      }),
    } as unknown as ImageValidatorService;

    const configService = {
      get: jest.fn((key: string) =>
        key === 'GEMINI_API_KEY' ? 'test-api-key' : undefined,
      ),
    } as unknown as ConfigService;

    const imageOptimizer = {
      compressImage: jest.fn(async (image: string) => image),
      normalizeToPortraitCanvas: jest.fn(async (image: string) => image),
    } as unknown as ImageOptimizerService;

    const service = new DirectGeminiTryOnService(
      imageValidator,
      configService,
      imageOptimizer,
    );

    return {
      service,
      imageValidator,
      imageOptimizer,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends Gemini the garment image first and the avatar second', async () => {
    const { service } = createService();
    const outputBase64 = await createImageBase64({ r: 10, g: 20, b: 30 });

    generateContentMock.mockResolvedValue({
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: outputBase64,
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          },
        ],
      },
    });

    await expect(
      (service as any).generateTryOnWithModel(
        'gemini-3.1-flash-image-preview',
        'prompt',
        { data: 'avatar-base64', mimeType: 'image/png' },
        { data: 'clothing-base64', mimeType: 'image/png' },
      ),
    ).resolves.toBe(outputBase64);

    expect(generateContentMock).toHaveBeenCalledTimes(1);

    const parts = generateContentMock.mock.calls[0][0];
    expect(parts[0].inlineData.data).toBe('clothing-base64');
    expect(parts[1].inlineData.data).toBe('avatar-base64');
    expect(parts[2]).toEqual({ text: 'prompt' });
  });

  it('returns the image Gemini sends back even when it matches the avatar', async () => {
    const { service } = createService();
    const avatarBase64 = await createImageBase64({ r: 200, g: 150, b: 100 });
    const clothingBase64 = await createImageBase64({ r: 50, g: 80, b: 120 });

    generateContentMock.mockResolvedValue({
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: avatarBase64,
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          },
        ],
      },
    });

    await expect(
      service.processTryOn(
        `data:image/png;base64,${avatarBase64}`,
        `data:image/png;base64,${clothingBase64}`,
      ),
    ).resolves.toMatchObject({
      success: true,
      resultImage: `data:image/jpeg;base64,${avatarBase64}`,
    });
  });

  it('compresses avatar and clothing inputs before Gemini generation', async () => {
    const { service, imageOptimizer } = createService();
    const avatarBase64 = await createImageBase64({ r: 120, g: 90, b: 70 });
    const clothingBase64 = await createImageBase64({ r: 30, g: 50, b: 160 });
    const outputBase64 = await createImageBase64({ r: 10, g: 220, b: 40 });

    generateContentMock.mockResolvedValue({
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: outputBase64,
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          },
        ],
      },
    });

    await service.processTryOn(
      `data:image/png;base64,${avatarBase64}`,
      `data:image/png;base64,${clothingBase64}`,
    );

    expect((imageOptimizer as any).compressImage).toHaveBeenNthCalledWith(
      1,
      `data:image/png;base64,${avatarBase64}`,
      {
        maxWidth: 896,
        maxHeight: 1344,
        quality: 78,
        format: 'jpeg',
      },
    );
    expect((imageOptimizer as any).compressImage).toHaveBeenNthCalledWith(
      2,
      `data:image/png;base64,${clothingBase64}`,
      {
        maxWidth: 1024,
        maxHeight: 1365,
        quality: 74,
        format: 'jpeg',
      },
    );
  });

  it('uses a single Gemini generation attempt during processTryOn', async () => {
    const { service } = createService();
    const performTryOnSpy = jest
      .spyOn(service as any, 'performTryOn')
      .mockRejectedValue(new Error('generation failed'));

    await expect(
      service.processTryOn(
        'https://example.com/avatar.jpg',
        'https://example.com/clothing.jpg',
      ),
    ).rejects.toThrow('Try-on processing failed: generation failed');

    expect(performTryOnSpy).toHaveBeenCalledTimes(1);
  });

  it('maps Gemini quota errors to rate limit exceptions and reuses cooldown', async () => {
    const { service } = createService();
    const avatarBase64 = await createImageBase64({ r: 90, g: 140, b: 40 });
    const clothingBase64 = await createImageBase64({ r: 180, g: 60, b: 90 });
    const quotaError = new Error(
      '[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com: [429 Too Many Requests] You exceeded your current quota.',
    );

    generateContentMock.mockRejectedValue(quotaError);

    await expect(
      service.processTryOn(
        `data:image/png;base64,${avatarBase64}`,
        `data:image/png;base64,${clothingBase64}`,
      ),
    ).rejects.toMatchObject({
      errorCode: TryOnErrorCode.RATE_LIMIT_EXCEEDED,
    });

    await expect(
      service.processTryOn(
        `data:image/png;base64,${avatarBase64}`,
        `data:image/png;base64,${clothingBase64}`,
      ),
    ).rejects.toMatchObject({
      errorCode: TryOnErrorCode.RATE_LIMIT_EXCEEDED,
    });

    expect(generateContentMock).toHaveBeenCalledTimes(1);
  });

  it('maps streamed Gemini quota errors to rate limit exceptions', async () => {
    const { service } = createService();
    const avatarBase64 = await createImageBase64({ r: 15, g: 100, b: 140 });
    const clothingBase64 = await createImageBase64({ r: 200, g: 110, b: 30 });

    generateContentStreamMock.mockRejectedValue(
      new Error(
        '[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com: [429 Too Many Requests] You exceeded your current quota.',
      ),
    );

    await expect(
      service.processTryOnStream(
        `data:image/png;base64,${avatarBase64}`,
        `data:image/png;base64,${clothingBase64}`,
      ),
    ).rejects.toMatchObject({
      errorCode: TryOnErrorCode.RATE_LIMIT_EXCEEDED,
    });
  });

  it('emits live preview frames when Gemini streams inline image data', async () => {
    const { service } = createService();
    const outputBase64 = await createImageBase64({ r: 80, g: 160, b: 210 });
    const onEvent = jest.fn();

    generateContentStreamMock.mockResolvedValue({
      stream: (async function* () {
        yield {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: outputBase64,
                      mimeType: 'image/png',
                    },
                  },
                ],
              },
            },
          ],
        };
      })(),
      response: Promise.resolve({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'done',
                },
              ],
            },
          },
        ],
      }),
    });

    await expect(
      (service as any).generateTryOnWithModelStream(
        'gemini-3.1-flash-image-preview',
        'prompt',
        { data: 'avatar-base64', mimeType: 'image/png' },
        { data: 'clothing-base64', mimeType: 'image/png' },
        onEvent,
      ),
    ).resolves.toBe(outputBase64);

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'preview',
        resultImage: `data:image/png;base64,${outputBase64}`,
      }),
    );
  });

  it('uses streamed image data when the final stream response omits it', async () => {
    const { service } = createService();
    const outputBase64 = await createImageBase64({ r: 90, g: 40, b: 160 });

    generateContentStreamMock.mockResolvedValue({
      stream: (async function* () {
        yield {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      data: outputBase64,
                      mimeType: 'image/png',
                    },
                  },
                  {
                    text: 'rendering complete',
                  },
                ],
              },
            },
          ],
        };
      })(),
      response: Promise.resolve({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'done',
                },
              ],
            },
          },
        ],
      }),
    });

    await expect(
      (service as any).generateTryOnWithModelStream(
        'gemini-3.1-flash-image-preview',
        'prompt',
        { data: 'avatar-base64', mimeType: 'image/png' },
        { data: 'clothing-base64', mimeType: 'image/png' },
      ),
    ).resolves.toBe(outputBase64);
  });
});
