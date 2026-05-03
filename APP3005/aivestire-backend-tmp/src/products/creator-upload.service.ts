import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { slugify } from '../common/utils/string.utils';
import {
  CreateProductHierarchyDto,
  CreatePatternDto,
  CreateColorVariantDto,
} from './dto/create-product-hierarchy.dto';
import { ProductStatus } from '@prisma/client';
import { SmsQueueService } from '../queues/sms-queue.service';

@Injectable()
export class CreatorUploadService {
  private readonly logger = new Logger(CreatorUploadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly smsQueueService: SmsQueueService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: Create full Product → Pattern → ColorVariant hierarchy
  // ──────────────────────────────────────────────────────────────────────────

  async createProductHierarchy(
    dto: CreateProductHierarchyDto,
    userId: string,
  ) {
    this.logger.log(
      `Creator (user ${userId}) uploading "${dto.title}" with ${dto.patterns.length} pattern(s)`,
    );

    // 1. Validate creator exists
    const creator = await this.prisma.creator.findUnique({
      where: { user_id: userId },
    });
    if (!creator) throw new NotFoundException('Creator profile not found');
    const creatorId = creator.creator_id;

    // 2. Upload all images before the DB transaction (avoids Prisma tx timeout)
    const uploadedPatterns = await this._uploadAllImages(dto, creatorId);

    // 3. Derive flat arrays for backward-compat columns on Product
    const allBodyShapes = [
      ...new Set(uploadedPatterns.flatMap((p) => p.body_shapes as string[])),
    ];
    const allSkinTones = [
      ...new Set(
        uploadedPatterns.flatMap((p) =>
          p.color_variants.flatMap((cv) => cv.skin_tones as string[]),
        ),
      ),
    ];
    const allColors = [
      ...new Set(
        uploadedPatterns.flatMap((p) => p.color_variants.map((cv) => cv.color as string)),
      ),
    ];

    // Compute total inventory BEFORE the transaction so we set it atomically
    const totalInventoryCount = uploadedPatterns.reduce(
      (sum, p) => sum + p.color_variants.reduce((s, cv) => s + cv.stock, 0),
      0,
    );

    // 4. Generate unique slug
    const slug = await this._generateUniqueSlug(dto.title);

    // 5. DB transaction
    const product = await this.prisma.$transaction(async (tx) => {
      // 5a. Create the Product — inventory_count is set atomically from variant stocks
      const newProduct = await tx.product.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description,
          price_cents: dto.price_cents,
          currency: dto.currency ?? 'INR',
          status: ProductStatus.DRAFT,
          // ✅ Single source of truth: sum of all color variant stocks
          inventory_count: totalInventoryCount,
          creator: { connect: { creator_id: creatorId } },
          category_rel: dto.category_id
            ? { connect: { category_id: dto.category_id } }
            : undefined,
          sub_category_rel: dto.sub_category_id
            ? { connect: { sub_category_id: dto.sub_category_id } }
            : undefined,
          sizes: dto.sizes ?? [],
          age_ranges: dto.age_ranges ?? [],
          // Flat arrays for recommendation engine (backward compat)
          body_shapes: allBodyShapes,
          skin_tones: allSkinTones,
          metadata: { colors: allColors },
        },
      });

      // 5b. Product group assignments
      if (dto.group_ids && dto.group_ids.length > 0) {
        await tx.productGroupAssignment.createMany({
          data: dto.group_ids.map((groupId) => ({
            product_id: newProduct.product_id,
            group_id: groupId,
          })),
          skipDuplicates: true,
        });
      }

      // 5c. Create Patterns → Color Variants → Images
      for (let pi = 0; pi < uploadedPatterns.length; pi++) {
        const patternData = uploadedPatterns[pi];

        const pattern = await tx.productPattern.create({
          data: {
            product_id: newProduct.product_id,
            name: patternData.name,
            body_shapes: patternData.body_shapes as any,
            display_order: pi,
          },
        });

        for (let ci = 0; ci < patternData.color_variants.length; ci++) {
          const variantData = patternData.color_variants[ci];

          const variant = await tx.productColorVariant.create({
            data: {
              pattern_id: pattern.pattern_id,
              color: variantData.color as any,
              hex_code: variantData.hex_code ?? undefined,
              stock: variantData.stock,
              skin_tones: variantData.skin_tones as any,
              display_order: ci,
            },
          });

          if (variantData.uploadedImageUrls.length > 0) {
            await tx.productColorVariantImage.createMany({
              data: variantData.uploadedImageUrls.map((url, imgIdx) => ({
                variant_id: variant.variant_id,
                url,
                order_index: imgIdx,
                is_primary: imgIdx === 0,
              })),
            });
          }
        }
      }

      return newProduct;
    });

    // Ensure all images are synced correctly to the backwards-compatible flat table
    // This also recomputes and persists inventory_count from variant stocks.
    await this._syncFlatArrays(product.product_id);

    this.logger.log(`✅ Product hierarchy created: ${product.product_id}`);

    // ─── SMS: Notify creator about their upload ────────────────────────────
    // Enqueued after all DB work is done. Failure never blocks the response.
    try {
      const creatorUser = await this.prisma.user.findUnique({
        where: { user_id: userId },
        select: { email: true, phone: true },
      });

      if (!creatorUser?.phone) {
        this.logger.warn(
          `Creator (user ${userId}) has no phone number — skipping upload SMS`,
        );
      } else {
        // Derive a friendly display name from the email (e.g. priya.sharma@... → Priya)
        const displayName = creatorUser.email.split('@')[0]?.split('.')[0] ?? 'Creator';
        const creatorName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        const frontendBaseUrl = (
          process.env.FRONTEND_URL || 'http://localhost:3005'
        ).replace(/\/+$/, '');

        const hierarchy = await this.getProductHierarchy(product.product_id);
        await this.smsQueueService.enqueueCreatorUploadSms({
          to: creatorUser.phone,
          creatorName,
          productTitle: product.title,
          productId: product.product_id,
          dashboardUrl: `${frontendBaseUrl}/creator-dashboard`,
          priceInRupees: dto.price_cents / 100,
          patternCount: hierarchy.pattern_count,
          totalColorVariants: hierarchy.total_color_variants,
          totalStock: hierarchy.total_stock,
          category: hierarchy.category_name ?? undefined,
          uploadedAt: new Date(),
          status: (product.status as 'DRAFT' | 'APPROVED' | 'PENDING') ?? 'DRAFT',
        });
      }
    } catch (error) {
      // SMS failure must never affect the product creation response
      this.logger.error(
        `Failed to enqueue creator upload SMS for product ${product.product_id}:`,
        error instanceof Error ? error.message : error,
      );
    }

    return this.getProductHierarchy(product.product_id);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: Get full hierarchy for a product
  // ──────────────────────────────────────────────────────────────────────────

  async getProductHierarchy(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { product_id: productId },
      include: {
        category_rel: true,
        sub_category_rel: true,
        creator: {
          select: {
            creator_id: true,
            store_name: true,
            store_slug: true,
            verified: true,
          },
        },
        patterns: {
          orderBy: { display_order: 'asc' },
          include: {
            color_variants: {
              orderBy: { display_order: 'asc' },
              include: {
                images: {
                  orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
                },
              },
            },
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');

    return {
      product_id: product.product_id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      price_cents: product.price_cents,
      currency: product.currency,
      status: product.status,
      category_id: product.category_id,
      sub_category_id: product.sub_category_id,
      category_name: product.category_rel?.name ?? null,
      sub_category_name: product.sub_category_rel?.name ?? null,
      creator: product.creator,
      pattern_count: product.patterns.length,
      total_color_variants: product.patterns.reduce(
        (sum, p) => sum + p.color_variants.length,
        0,
      ),
      total_stock: product.patterns.reduce(
        (sum, p) =>
          sum + p.color_variants.reduce((s, cv) => s + cv.stock, 0),
        0,
      ),
      patterns: product.patterns.map((pattern) => ({
        pattern_id: pattern.pattern_id,
        name: pattern.name,
        body_shapes: pattern.body_shapes,
        display_order: pattern.display_order,
        color_variant_count: pattern.color_variants.length,
        color_variants: pattern.color_variants.map((cv) => ({
          variant_id: cv.variant_id,
          color: cv.color,
          hex_code: cv.hex_code,
          stock: cv.stock,
          skin_tones: cv.skin_tones,
          display_order: cv.display_order,
          primary_image: cv.images.find((img) => img.is_primary)?.url ?? null,
          images: cv.images.map((img) => ({
            image_id: img.image_id,
            url: img.url,
            is_primary: img.is_primary,
            order_index: img.order_index,
          })),
        })),
      })),
      created_at: product.created_at,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: Add a pattern to an existing product
  // ──────────────────────────────────────────────────────────────────────────

  async addPattern(
    productId: string,
    userId: string,
    patternDto: CreatePatternDto,
  ) {
    const creatorId = await this._assertCreatorOwnsProduct(productId, userId);

    const existingCount = await this.prisma.productPattern.count({
      where: { product_id: productId },
    });

    const uploadedVariants = await this._uploadVariantImages(
      patternDto.color_variants,
      creatorId,
      productId,
    );

    const pattern = await this.prisma.productPattern.create({
      data: {
        product_id: productId,
        name: patternDto.name,
        body_shapes: patternDto.body_shapes as any,
        display_order: existingCount,
        color_variants: {
          create: uploadedVariants.map((v, ci) => ({
            color: v.color as any,
            hex_code: v.hex_code ?? undefined,
            stock: v.stock,
            skin_tones: v.skin_tones as any,
            display_order: ci,
            images: {
              create: v.uploadedImageUrls.map((url, imgIdx) => ({
                url,
                order_index: imgIdx,
                is_primary: imgIdx === 0,
              })),
            },
          })),
        },
      },
      include: {
        color_variants: { include: { images: true } },
      },
    });

    await this._syncFlatArrays(productId);
    this.logger.log(`Pattern added to product ${productId}: ${pattern.pattern_id}`);
    return pattern;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: Remove a pattern (cascade deletes variants + images)
  // ──────────────────────────────────────────────────────────────────────────

  async removePattern(patternId: string, userId: string) {
    const pattern = await this.prisma.productPattern.findUnique({
      where: { pattern_id: patternId },
    });
    if (!pattern) throw new NotFoundException('Pattern not found');

    const creatorId = await this._assertCreatorOwnsProduct(pattern.product_id, userId);

    await this.prisma.productPattern.delete({ where: { pattern_id: patternId } });
    await this._syncFlatArrays(pattern.product_id);

    return { message: 'Pattern removed successfully' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: Add a color variant to an existing pattern
  // ──────────────────────────────────────────────────────────────────────────

  async addColorVariant(
    patternId: string,
    userId: string,
    variantDto: CreateColorVariantDto,
  ) {
    const pattern = await this.prisma.productPattern.findUnique({
      where: { pattern_id: patternId },
    });
    if (!pattern) throw new NotFoundException('Pattern not found');

    const creatorId = await this._assertCreatorOwnsProduct(pattern.product_id, userId);

    const existingCount = await this.prisma.productColorVariant.count({
      where: { pattern_id: patternId },
    });

    const [uploadedVariant] = await this._uploadVariantImages(
      [variantDto],
      creatorId,
      pattern.product_id,
    );

    const variant = await this.prisma.productColorVariant.create({
      data: {
        pattern_id: patternId,
        color: uploadedVariant.color as any,
        hex_code: uploadedVariant.hex_code ?? undefined,
        stock: uploadedVariant.stock,
        skin_tones: uploadedVariant.skin_tones as any,
        display_order: existingCount,
        images: {
          create: uploadedVariant.uploadedImageUrls.map((url, imgIdx) => ({
            url,
            order_index: imgIdx,
            is_primary: imgIdx === 0,
          })),
        },
      },
      include: { images: true },
    });

    await this._syncFlatArrays(pattern.product_id);
    return variant;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: Remove a color variant
  // ──────────────────────────────────────────────────────────────────────────

  async removeColorVariant(variantId: string, userId: string) {
    const variant = await this.prisma.productColorVariant.findUnique({
      where: { variant_id: variantId },
      include: { pattern: true },
    });
    if (!variant) throw new NotFoundException('Color variant not found');

    const creatorId = await this._assertCreatorOwnsProduct(variant.pattern.product_id, userId);

    await this.prisma.productColorVariant.delete({
      where: { variant_id: variantId },
    });
    await this._syncFlatArrays(variant.pattern.product_id);

    return { message: 'Color variant removed successfully' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  /** Upload images for all patterns/variants before the DB transaction */
  private async _uploadAllImages(
    dto: CreateProductHierarchyDto,
    creatorId: string,
  ) {
    return Promise.all(
      dto.patterns.map(async (pattern) => ({
        ...pattern,
        color_variants: await this._uploadVariantImages(
          pattern.color_variants,
          creatorId,
          'pending',
        ),
      })),
    );
  }

  /** Upload images for a list of color variant DTOs */
  private async _uploadVariantImages(
    variants: CreateColorVariantDto[],
    creatorId: string,
    _productId: string,
  ) {
    return Promise.all(
      variants.map(async (variant) => {
        const uploadedImageUrls: string[] = [];

        for (const base64 of variant.images) {
          try {
            const imageData = base64.startsWith('data:')
              ? base64
              : `data:image/jpeg;base64,${base64}`;

            const url = await this.cloudinaryService.uploadImage(imageData);
            uploadedImageUrls.push(url);
          } catch (err: any) {
            this.logger.error(
              `Image upload failed for creator ${creatorId}: ${err.message}`,
            );
            throw new BadRequestException(
              `Image upload failed for color ${variant.color}: ${err.message}`,
            );
          }
        }

        return {
          color: variant.color,
          hex_code: variant.hex_code,
          stock: variant.stock,
          skin_tones: variant.skin_tones,
          uploadedImageUrls,
        };
      }),
    );
  }

  /** Generate a unique URL-safe slug */
  private async _generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    let slug = base;
    let i = 1;
    while (await this.prisma.product.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }

  /**
   * Re-compute and persist flat arrays + inventory_count on the parent Product.
   *
   * SINGLE SOURCE OF TRUTH: Product.inventory_count always equals the sum of
   * all ProductColorVariant.stock values for that product. This method enforces
   * that invariant whenever patterns or variants are created/removed.
   *
   * Uses sequential awaits (not the fragile array-form $transaction) so that
   * a failure in image sync does not silently skip the inventory_count update.
   */
  private async _syncFlatArrays(productId: string) {
    const patterns = await this.prisma.productPattern.findMany({
      where: { product_id: productId },
      orderBy: { display_order: 'asc' },
      include: {
        color_variants: {
          orderBy: { display_order: 'asc' },
          include: {
            images: { orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }] },
          },
        },
      },
    });

    const allBodyShapes: string[] = [
      ...new Set(patterns.flatMap((p) => p.body_shapes as string[])),
    ];
    const allSkinTones: string[] = [
      ...new Set(
        patterns.flatMap((p) =>
          p.color_variants.flatMap((cv) => cv.skin_tones as string[]),
        ),
      ),
    ];
    const allColors: string[] = [
      ...new Set(
        patterns.flatMap((p) => p.color_variants.map((cv) => cv.color as string)),
      ),
    ];

    // Extract all image URLs in exact display order
    const allImageUrls = patterns.flatMap((p) =>
      p.color_variants.flatMap((cv) => cv.images.map((img) => img.url)),
    );

    // ✅ Compute the single-source-of-truth inventory count
    const totalInventory = patterns.reduce(
      (sum, p) => sum + p.color_variants.reduce((s, cv) => s + cv.stock, 0),
      0,
    );

    // Step 1: Update the product's flat columns + inventory_count atomically
    // This MUST succeed — it is the most critical operation.
    await this.prisma.product.update({
      where: { product_id: productId },
      data: {
        body_shapes: allBodyShapes,
        skin_tones: allSkinTones,
        metadata: { colors: allColors },
        // ✅ Keep flat inventory_count in sync with sum of variant stocks
        inventory_count: totalInventory,
        updated_at: new Date(),
      },
    });

    // Step 2: Rebuild the flat ProductImage table (best-effort, separate from inventory)
    try {
      await this.prisma.productImage.deleteMany({
        where: { product_id: productId },
      });

      if (allImageUrls.length > 0) {
        await this.prisma.productImage.createMany({
          data: allImageUrls.map((url, i) => ({
            product_id: productId,
            url,
            order_index: i,
            is_primary: i === 0,
          })),
        });
      }
    } catch (imgErr) {
      // Image sync failure must NOT roll back the inventory_count update.
      // The canonical images live in ProductColorVariantImage; the flat
      // ProductImage table is only a convenience cache.
      this.logger.warn(
        `[_syncFlatArrays] Image cache rebuild failed for product ${productId} (inventory already updated): ${
          imgErr instanceof Error ? imgErr.message : String(imgErr)
        }`,
      );
    }

    this.logger.debug(
      `[_syncFlatArrays] product=${productId} inventory_count=${totalInventory} colours=${allColors.length}`,
    );
  }

  /** Guard: ensure the requesting creator owns the product */
  private async _assertCreatorOwnsProduct(
    productId: string,
    userId: string,
  ) {
    const creator = await this.prisma.creator.findUnique({
      where: { user_id: userId },
    });
    if (!creator) throw new NotFoundException('Creator profile not found');

    const product = await this.prisma.product.findFirst({
      where: { product_id: productId, creator_id: creator.creator_id },
    });
    if (!product) {
      throw new BadRequestException(
        'You do not have permission to modify this product',
      );
    }
    return creator.creator_id;
  }
}
