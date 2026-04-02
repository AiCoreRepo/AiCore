import sharp from 'sharp';
import { ConfigService } from '@nestjs/config';
import { DirectGeminiTryOnService } from './direct-gemini-tryon.service';
import { ImageValidatorService } from '../common/image-validator.service';
import { ImageOptimizerService } from '../../../common/image-optimizer.service';

const generateContentMock = jest.fn();
const getGenerativeModelMock = jest.fn(() => ({
  generateContent: generateContentMock,
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
    } as unknown as ImageValidatorService;

    const configService = {
      get: jest.fn((key: string) =>
        key === 'GEMINI_API_KEY' ? 'test-api-key' : undefined,
      ),
    } as unknown as ConfigService;

    const imageOptimizer = {
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
});
