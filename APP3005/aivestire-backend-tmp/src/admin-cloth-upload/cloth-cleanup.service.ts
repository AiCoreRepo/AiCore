import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ProductStatus, Prisma } from '@prisma/client';
import * as path from 'path';
import { CloudinaryService } from '../common/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';
import { CleanupAdminClothUploadDto } from './dto/cleanup-admin-cloth-upload.dto';

const DEFAULT_FOLDER_RELATIVE_PATH = 'admin-cloth-upload/incoming';
const DEFAULT_LIMIT = 100;

interface CandidateProduct {
  product_id: string;
  title: string;
  metadata: Prisma.JsonValue | null;
  is_deleted: boolean;
  images: Array<{ url: string }>;
  _count: {
    order_items: number;
  };
}

@Injectable()
export class ClothCleanupService {
  private readonly logger = new Logger(ClothCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async cleanup(dto: CleanupAdminClothUploadDto) {
    const sourceFolder = this.resolveSourceFolder(dto.source_folder);
    const limit = dto.limit ?? DEFAULT_LIMIT;
    const dryRun = dto.dry_run ?? false;
    const hardDelete = dto.hard_delete ?? true;

    const creator = await this.getOrCreateCollectionCreator();

    const products = await this.prisma.product.findMany({
      where: {
        creator_id: creator.creator_id,
      },
      include: {
        images: {
          select: { url: true },
        },
        _count: {
          select: {
            order_items: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 1000,
    });

    const candidates = (products as CandidateProduct[])
      .filter((product) => this.isAdminClothUploadProduct(product.metadata, sourceFolder))
      .slice(0, limit);

    if (dryRun) {
      return {
        success: true,
        dry_run: true,
        source_folder: sourceFolder,
        limit,
        matched: candidates.length,
        products: candidates.map((p) => ({
          product_id: p.product_id,
          title: p.title,
          is_deleted: p.is_deleted,
          order_items: p._count.order_items,
          image_count: p.images.length,
        })),
      };
    }

    let deleted = 0;
    let skipped = 0;
    let errors = 0;
    const details: Array<{ product_id: string; title: string; status: string; reason?: string }> = [];

    for (const product of candidates) {
      try {
        if (product._count.order_items > 0) {
          skipped++;
          details.push({
            product_id: product.product_id,
            title: product.title,
            status: 'skipped',
            reason: 'Product has order items and cannot be cleaned up safely',
          });
          continue;
        }

        const publicIds = this.extractCloudinaryPublicIds(product);

        const failedCloudinaryIds: string[] = [];
        for (const publicId of publicIds) {
          try {
            await this.cloudinaryService.deleteByPublicId(publicId);
          } catch (error) {
            failedCloudinaryIds.push(publicId);
            const message = error instanceof Error ? error.message : 'Unknown Cloudinary error';
            this.logger.warn(`Cloudinary delete failed for ${publicId}: ${message}`);
          }
        }

        if (failedCloudinaryIds.length > 0) {
          errors++;
          details.push({
            product_id: product.product_id,
            title: product.title,
            status: 'error',
            reason: `Failed to delete ${failedCloudinaryIds.length} Cloudinary asset(s)`,
          });
          continue;
        }

        await this.prisma.$transaction(async (tx) => {
          const approvals = await tx.productApproval.findMany({
            where: { product_id: product.product_id },
            select: { approval_id: true },
          });
          const approvalIds = approvals.map((a) => a.approval_id);

          if (approvalIds.length > 0) {
            await tx.approvalLog.deleteMany({
              where: { approval_id: { in: approvalIds } },
            });
          }

          await tx.productApproval.deleteMany({
            where: { product_id: product.product_id },
          });

          await tx.productImage.deleteMany({
            where: { product_id: product.product_id },
          });

          await tx.productStat.deleteMany({
            where: { product_id: product.product_id },
          });

          await tx.productLike.deleteMany({
            where: { product_id: product.product_id },
          });

          await tx.productComment.deleteMany({
            where: { product_id: product.product_id },
          });

          await tx.tryOn.deleteMany({
            where: { product_id: product.product_id },
          });

          await tx.cartItem.deleteMany({
            where: { product_id: product.product_id },
          });

          await tx.guestCartItem.deleteMany({
            where: { product_id: product.product_id },
          });

          await tx.wishlistItem.deleteMany({
            where: { product_id: product.product_id },
          });

          await tx.productGroupAssignment.deleteMany({
            where: { product_id: product.product_id },
          });

          await tx.creatorCoupon.deleteMany({
            where: { product_id: product.product_id },
          });

          if (hardDelete) {
            await tx.product.delete({
              where: { product_id: product.product_id },
            });
          } else {
            await tx.product.update({
              where: { product_id: product.product_id },
              data: {
                is_deleted: true,
                status: ProductStatus.ARCHIVED,
              },
            });
          }
        });

        deleted++;
        details.push({
          product_id: product.product_id,
          title: product.title,
          status: hardDelete ? 'deleted' : 'archived',
        });
      } catch (error) {
        errors++;
        const message = error instanceof Error ? error.message : 'Unknown cleanup error';
        details.push({
          product_id: product.product_id,
          title: product.title,
          status: 'error',
          reason: message,
        });
      }
    }

    return {
      success: true,
      dry_run: false,
      source_folder: sourceFolder,
      limit,
      matched: candidates.length,
      deleted,
      skipped,
      errors,
      details,
    };
  }

  private resolveSourceFolder(sourceFolder?: string): string {
    if (sourceFolder && sourceFolder.trim()) {
      return path.isAbsolute(sourceFolder)
        ? sourceFolder
        : path.resolve(process.cwd(), sourceFolder);
    }

    return path.resolve(process.cwd(), DEFAULT_FOLDER_RELATIVE_PATH);
  }

  private isAdminClothUploadProduct(metadata: Prisma.JsonValue | null, sourceFolder: string): boolean {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return false;
    }

    const root = metadata as Record<string, unknown>;
    const admin = root.admin_cloth_upload;
    if (!admin || typeof admin !== 'object' || Array.isArray(admin)) {
      return false;
    }

    const adminMeta = admin as Record<string, unknown>;
    const source = adminMeta.source_folder;
    if (typeof source !== 'string') {
      return false;
    }

    return source === sourceFolder;
  }

  private extractCloudinaryPublicIds(product: CandidateProduct): string[] {
    const ids = new Set<string>();

    if (
      product.metadata &&
      typeof product.metadata === 'object' &&
      !Array.isArray(product.metadata)
    ) {
      const root = product.metadata as Record<string, unknown>;
      const admin = root.admin_cloth_upload;
      if (admin && typeof admin === 'object' && !Array.isArray(admin)) {
        const adminMeta = admin as Record<string, unknown>;
        if (typeof adminMeta.cloudinary_public_id === 'string') {
          ids.add(adminMeta.cloudinary_public_id);
        }
      }
    }

    for (const image of product.images) {
      const extracted = this.cloudinaryService.extractPublicId(image.url);
      if (extracted) {
        ids.add(extracted);
      }
    }

    return Array.from(ids);
  }

  private async getOrCreateCollectionCreator() {
    let creatorUser = await this.prisma.user.findFirst({
      where: { email: 'collections@aivestire.com' },
    });

    if (!creatorUser) {
      throw new BadRequestException(
        'Collection creator user not found. Run sync/upload once before cleanup.',
      );
    }

    const creator = await this.prisma.creator.findUnique({
      where: { user_id: creatorUser.user_id },
    });

    if (!creator) {
      throw new BadRequestException(
        'Collection creator profile not found. Run sync/upload once before cleanup.',
      );
    }

    return creator;
  }
}
