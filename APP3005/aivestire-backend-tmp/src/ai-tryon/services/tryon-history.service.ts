import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TryOnHistoryItem {
  tryOnId: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  // Frontend gallery expects this key.
  resultImage: string;
  // Backwards/other-client compatibility.
  resultImageUrl: string;
  thumbnailUrl: string | null;
  compressedUrl: string | null;
  provider: string;
  angle: string | null;
  baseTryOnId: string | null;
  anglesGenerated: string[];
  createdAt: string;
}

export interface TryOnHistoryResponse {
  success: boolean;
  tryOns: TryOnHistoryItem[];
  count: number;
}

@Injectable()
export class TryOnHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getTryOnHistory(
    userId: string,
    take?: number,
  ): Promise<TryOnHistoryResponse> {
    const tryOns = await this.prisma.tryOn.findMany({
      where: { user_id: userId },
      include: {
        product: {
          select: {
            product_id: true,
            title: true,
            images: {
              where: { is_primary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
      ...(typeof take === 'number' ? { take } : {}),
    });

    return {
      success: true,
      tryOns: tryOns.map((tryOn) => ({
        tryOnId: tryOn.try_on_id,
        productId: tryOn.product_id,
        productTitle: tryOn.product.title,
        productImage: tryOn.product.images[0]?.url ?? null,
        resultImage: tryOn.result_image_url,
        resultImageUrl: tryOn.result_image_url,
        thumbnailUrl: tryOn.thumbnail_url ?? null,
        compressedUrl: tryOn.compressed_url ?? null,
        provider: tryOn.provider,
        angle: tryOn.angle ?? null,
        baseTryOnId: (tryOn.base_tryon_id as string | null) ?? null,
        anglesGenerated: tryOn.angles_generated ?? [],
        createdAt: tryOn.created_at.toISOString(),
      })),
      count: tryOns.length,
    };
  }
}
