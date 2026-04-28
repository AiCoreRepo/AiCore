import { ConflictException } from '@nestjs/common';
import type { Request } from 'express';
import { AuraStatus } from '@prisma/client';
import { AuraService } from './services/aura.service';

describe('AuraService', () => {
  const minimalAuraDto = {
    skinTone: 'medium',
    bodyShape: 'hourglass',
    bodySize: 'medium',
  };

  const existingAura = {
    aura_id: 'aura-1',
    user_id: 'user-1',
    image_url: 'https://example.com/original.png',
    model_url: 'https://example.com/avatar-2.png',
    tryon_model_url: 'https://example.com/avatar-2-tryon.png',
    height_cm: 170,
    weight_kg: 70,
    skin_tone: 'medium',
    gender: 'female',
    body_shape: 'hourglass',
    body_size: 'medium',
    age_range: '25-35',
    hair_style: 'long',
    generated_avatar_urls: [
      'https://example.com/avatar-1.png',
      'https://example.com/avatar-2.png',
    ],
    attributes: {
      selected_avatar_id: 'avatar-2',
      avatar_history: [
        {
          avatar_id: 'avatar-1',
          model_url: 'https://example.com/avatar-1.png',
          tryon_model_url: 'https://example.com/avatar-1-tryon.png',
          source: 'creation',
          generation_type: 'generated',
          created_at: '2026-03-17T08:00:00.000Z',
          attributes: {
            body_shape: 'hourglass',
            body_size: 'medium',
            skin_tone: 'medium',
          },
        },
        {
          avatar_id: 'avatar-2',
          model_url: 'https://example.com/avatar-2.png',
          tryon_model_url: 'https://example.com/avatar-2-tryon.png',
          source: 'recreation',
          generation_type: 'generated',
          created_at: '2026-03-18T08:00:00.000Z',
          attributes: {
            body_shape: 'hourglass',
            body_size: 'medium',
            skin_tone: 'medium',
          },
        },
      ],
    },
    created_at: new Date('2026-03-17T08:00:00.000Z'),
    updated_at: new Date('2026-03-18T08:00:00.000Z'),
  };

  const createService = (user: {
    avatar_regenerations_used: number;
    max_avatar_regenerations: number;
  }) => {
    const prisma = {
      aura: {
        findUnique: jest.fn().mockResolvedValue(existingAura),
        update: jest.fn().mockImplementation(async ({ data }: any) => ({
          ...existingAura,
          ...data,
        })),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
      },
      $transaction: jest.fn(),
    };

    const cloudinary = {
      uploadImage: jest.fn(),
    };

    const auraQueue = {
      addAuraGenerationJob: jest.fn().mockResolvedValue({ id: 42 }),
    };

    const tx = {
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      aura: {
        update: jest.fn().mockResolvedValue({
          aura_id: existingAura.aura_id,
          status: AuraStatus.PENDING,
        }),
      },
    };

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback(tx),
    );

    return {
      service: new AuraService(
        prisma as any,
        cloudinary as any,
        auraQueue as any,
      ),
      prisma,
      auraQueue,
      tx,
    };
  };

  it('allows recreation while the user still has remaining credits', async () => {
    const { service, auraQueue, tx } = createService({
      avatar_regenerations_used: 1,
      max_avatar_regenerations: 2,
    });
    const request = {
      headers: { origin: 'https://aivestire.com' },
    } as Request;

    await expect(
      service.recreateAura('user-1', undefined, minimalAuraDto as any, request),
    ).resolves.toMatchObject({
      aura_id: existingAura.aura_id,
      status: AuraStatus.PENDING,
      job_id: '42',
    });

    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: {
        user_id: 'user-1',
        avatar_regenerations_used: {
          lt: 2,
        },
      },
      data: {
        avatar_regenerations_used: {
          increment: 1,
        },
      },
    });
    expect(auraQueue.addAuraGenerationJob).toHaveBeenCalled();
  });

  it('blocks recreation after the configured limit is reached', async () => {
    const { service, auraQueue, tx } = createService({
      avatar_regenerations_used: 2,
      max_avatar_regenerations: 2,
    });
    const request = {
      headers: { origin: 'https://aivestire.com' },
    } as Request;

    await expect(
      service.recreateAura('user-1', undefined, minimalAuraDto as any, request),
    ).rejects.toEqual(
      new ConflictException(
        'You have reached your Aura recreation limit of 2.',
      ),
    );

    expect(tx.user.updateMany).not.toHaveBeenCalled();
    expect(auraQueue.addAuraGenerationJob).not.toHaveBeenCalled();
  });

  it('raises recreation credits to 200 on localhost', async () => {
    const { service, auraQueue, tx } = createService({
      avatar_regenerations_used: 150,
      max_avatar_regenerations: 2,
    });
    const request = {
      headers: { origin: 'http://localhost:8080' },
    } as Request;

    await expect(
      service.recreateAura('user-1', undefined, minimalAuraDto as any, request),
    ).resolves.toMatchObject({
      aura_id: existingAura.aura_id,
      status: AuraStatus.PENDING,
      job_id: '42',
    });

    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: {
        user_id: 'user-1',
        avatar_regenerations_used: {
          lt: 200,
        },
      },
      data: {
        avatar_regenerations_used: {
          increment: 1,
        },
      },
    });
    expect(auraQueue.addAuraGenerationJob).toHaveBeenCalled();
  });

  it('switches the selected avatar used for try-ons', async () => {
    const { service, prisma } = createService({
      avatar_regenerations_used: 0,
      max_avatar_regenerations: 2,
    });

    const result = await service.selectAvatarForTryOns('user-1', 'avatar-1');

    expect(prisma.aura.update).toHaveBeenCalledWith({
      where: { user_id: 'user-1' },
      data: expect.objectContaining({
        model_url: 'https://example.com/avatar-1.png',
        tryon_model_url: 'https://example.com/avatar-1-tryon.png',
      }),
    });
    expect(result).toMatchObject({
      selected_avatar_id: 'avatar-1',
      model_url: 'https://example.com/avatar-1.png',
      tryon_model_url: 'https://example.com/avatar-1-tryon.png',
    });
  });
});
