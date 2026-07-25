import { NotFoundException } from '@nestjs/common';
import { AuraStatus } from '@prisma/client';
import { AIProvider, TryOnStatus } from '../enums/ai-provider.enum';
import { GuestTryOnClaimService } from './guest-tryon-claim.service';

describe('GuestTryOnClaimService', () => {
  const productId = 'bcc83c81-204f-4d52-ad37-55d008cc80fd';
  const avatarUrl =
    'https://res.cloudinary.com/dxfxicebq/image/upload/v1/aivestire/avatars/guest/avatar.png';

  const createService = () => {
    const prisma = {
      aura: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }) => ({
          aura_id: 'aura-1',
          created_at: new Date(),
          updated_at: new Date(),
          ...data,
        })),
        update: jest.fn(),
      },
      product: {
        findUnique: jest.fn().mockResolvedValue({
          product_id: productId,
          title: 'Ivory Threadwork Kurta',
        }),
      },
      tryOn: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue({ try_on_id: 'tryon-1' }),
      },
    };
    const cloudinary = {
      uploadWithMetadata: jest.fn().mockResolvedValue({
        secureUrl: 'https://res.cloudinary.com/dxfxicebq/image/upload/tryon.png',
        publicId: 'try-ons/tryon',
      }),
      getThumbnailUrl: jest.fn().mockReturnValue('thumbnail-url'),
      getCompressedUrl: jest.fn().mockReturnValue('compressed-url'),
    };
    const tryOnQueue = {
      getCompletedJobForRequestUser: jest.fn().mockResolvedValue({
        data: {
          type: 'direct',
          provider: AIProvider.GEMINI_AI,
          requestUserId: 'guest:session-id',
          avatarImage: 'data:image/png;base64,input',
          clothingImage: 'https://example.com/item.png',
          additionalParams: {
            garmentGender: 'female',
            selectedLookId: productId,
          },
        },
        result: {
          success: true,
          resultImage: 'data:image/png;base64,result',
          provider: AIProvider.GEMINI_AI,
          status: TryOnStatus.SUCCESS,
          processingTimeMs: 1200,
          metadata: { guestAvatarUrl: avatarUrl },
          timestamp: new Date().toISOString(),
        },
      }),
    };

    return {
      service: new GuestTryOnClaimService(
        prisma as any,
        cloudinary as any,
        tryOnQueue as any,
      ),
      prisma,
      cloudinary,
      tryOnQueue,
    };
  };

  it('claims the generated guest avatar and persists its completed try-on', async () => {
    const { service, prisma } = createService();

    const result = await service.claim(
      'user-1',
      'guest:session-id',
      'job-1',
    );

    expect(result).toMatchObject({
      success: true,
      auraId: 'aura-1',
      avatarUrl,
      tryOnId: 'tryon-1',
      productId,
    });
    expect(prisma.aura.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: 'user-1',
        model_url: avatarUrl,
        tryon_model_url: avatarUrl,
        gender: 'female',
        status: AuraStatus.READY,
      }),
    });
    expect(prisma.tryOn.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: 'user-1',
        product_id: productId,
        aura_id: 'aura-1',
      }),
      select: { try_on_id: true },
    });
  });

  it('rejects a job that does not belong to the guest session', async () => {
    const { service, tryOnQueue } = createService();
    tryOnQueue.getCompletedJobForRequestUser.mockResolvedValue(null);

    await expect(
      service.claim('user-1', 'guest:wrong-session', 'job-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
