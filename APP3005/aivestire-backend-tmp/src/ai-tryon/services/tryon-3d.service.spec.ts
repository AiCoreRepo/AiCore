import { HttpException } from '@nestjs/common';
import { TryOn3DService } from './tryon-3d.service';

describe('TryOn3DService', () => {
  const makeService = (overrides: {
    directVertexResult?: any;
    visualSimilarity?: boolean;
  } = {}) => {
    const prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue({
          product_id: 'product-1',
          title: 'Look',
          images: [{ url: 'https://example.com/product.jpg', is_primary: true }],
        }),
      },
      tryOn: {
        create: jest.fn().mockResolvedValue({ try_on_id: 'tryon-1' }),
      },
      user: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const directVertexService = {
      processTryOn: jest.fn().mockResolvedValue(
        overrides.directVertexResult ?? {
          success: true,
          resultImage: 'data:image/jpeg;base64,vertex-output',
          provider: 'VERTEX_AI',
          status: 'SUCCESS',
          processingTimeMs: 12,
          timestamp: new Date().toISOString(),
        },
      ),
    };

    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    const cloudinaryService = {
      uploadWithMetadata: jest.fn().mockResolvedValue({
        secureUrl: 'https://example.com/try-on.jpg',
        publicId: 'public-id',
        bytes: 12345,
      }),
      getThumbnailUrl: jest.fn().mockReturnValue('https://example.com/thumb.jpg'),
      getCompressedUrl: jest
        .fn()
        .mockReturnValue('https://example.com/compressed.jpg'),
    };

    const imageOptimizer = {
      areImagesVisuallySimilar: jest
        .fn()
        .mockResolvedValue(overrides.visualSimilarity ?? false),
      extractImageMetadata: jest.fn().mockResolvedValue({
        width: 512,
        height: 512,
        format: 'jpeg',
        size: 1000,
      }),
      extractDominantColors: jest.fn().mockResolvedValue(['#ffffff']),
      shouldCompress: jest.fn().mockReturnValue(false),
      compressImage: jest.fn(),
    };

    const service = new TryOn3DService(
      prisma as any,
      directVertexService as any,
      configService as any,
      cloudinaryService as any,
      imageOptimizer as any,
    );

    return {
      service,
      prisma,
      directVertexService,
      imageOptimizer,
    };
  };

  it('throws when Vertex output is unchanged and avatar-like instead of retrying', async () => {
    const { service } = makeService({
      visualSimilarity: true,
    });

    await expect(
      service.tryOnWithVertex(
        {
          aura_id: 'aura-1',
          user_id: 'user-1',
          model_url: 'https://example.com/avatar.jpg',
          height_cm: 170,
          weight_kg: 60,
          skin_tone: 'medium',
          gender: 'female',
          body_shape: 'athletic',
          age_range: '25_35',
          hair_style: 'long',
          beard: null,
          extra_attributes: null,
        } as any,
        'product-1',
      ),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
