import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma, UserRole, ProductStatus, OrderStatus } from '@prisma/client';
import { CloudinaryService } from '../common/cloudinary.service';
import { nanoid } from 'nanoid';
import { PayUVpaService } from './payu-vpa.service';

const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;
const CREATOR_PAYOUT_GATEWAY = 'PAYU';
const CREATOR_PAYOUT_METHOD = 'UPI';

@Injectable()
export class CreatorDashboardService {
  private readonly logger = new Logger(CreatorDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly payUVpaService: PayUVpaService,
  ) {}

  /**
   * Helper method to get creator_id from user_id
   */
  private async getCreatorIdFromUserId(userId: string): Promise<string> {
    const creator = await this.prisma.creator.findUnique({
      where: { user_id: userId },
      select: { creator_id: true },
    });

    if (!creator) {
      const user = await this.prisma.user.findUnique({
        where: { user_id: userId },
        select: { email: true, role: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role !== UserRole.CREATOR) {
        throw new ForbiddenException('User is not a creator');
      }

      // If user is a creator but is_creator is false, update it
      // if (user.role === 'creator' && !user.is_creator) {
      //   await this.prisma.user.update({
      //     where: { user_id: userId },
      //     data: { is_creator: true },
      //   });
      //   this.logger.log(`Updated user ${userId} is_creator to true.`);
      // }

      // If creator profile still not found after checks, it means it should have been created during registration
      // This indicates an inconsistency or a user trying to access creator features without a profile
      throw new NotFoundException(
        'Creator profile not found for this user. Please ensure your creator profile is set up.',
      );
    }

    return creator.creator_id;
  }

  /**
   * Helper method to slugify a string
   */
  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private decimalToCents(value: Prisma.Decimal | number | null | undefined) {
    if (value == null) {
      return 0;
    }

    return Math.round(parseFloat(value.toString()) * 100);
  }

  private normalizePayoutBeneficiaryName(value?: string | null) {
    return value?.trim() || '';
  }

  private resolvePayoutBeneficiaryName(
    manualBeneficiaryName: string,
    verifiedBeneficiaryName: string | null,
  ) {
    return verifiedBeneficiaryName || manualBeneficiaryName;
  }

  async verifyCreatorPayoutUpi(userId: string, upiId: string) {
    await this.getCreatorIdFromUserId(userId);

    const verification = await this.payUVpaService.verifyUpiId(upiId);

    return {
      ...verification,
      verifiedAt: new Date().toISOString(),
    };
  }

  async getCreatorDashboardMetrics(userId: string) {
    const creatorId = await this.getCreatorIdFromUserId(userId);
    const products = await this.prisma.product.findMany({
      where: {
        creator_id: creatorId,
        is_deleted: false,
      },
      select: {
        product_id: true,
        title: true,
        price_cents: true,
        currency: true,
        inventory_count: true,
        status: true,
        created_at: true,
        stats: true,
        images: {
          where: { is_primary: true },
          take: 1,
          select: { url: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const deliveredSales = await this.prisma.orderItem.aggregate({
      where: {
        product: {
          creator_id: creatorId,
          is_deleted: false,
        },
        order: {
          current_status: OrderStatus.DELIVERED,
        },
      },
      _sum: {
        quantity: true,
        total_price: true,
      },
    });

    const totalProducts = products.length;
    let totalLikes = 0;
    let totalViews = 0;
    let totalComments = 0;
    let totalInventoryUnits = 0;
    let totalPriceCents = 0;
    let soldOutProducts = 0;

    const statusBreakdown = {
      active: 0,
      pending: 0,
      draft: 0,
      rejected: 0,
    };

    const latestImages = products
      .slice(0, 4)
      .map((product) => product.images[0]?.url)
      .filter((url): url is string => Boolean(url));

    let topProduct:
      | {
          title: string;
          imageUrl: string | null;
          status: 'Active' | 'Pending' | 'Draft' | 'Rejected';
          likes: number;
          views: number;
          priceCents: number;
        }
      | null = null;

    for (const product of products) {
      totalPriceCents += product.price_cents;
      totalInventoryUnits += product.inventory_count || 0;

      const likes = product.stats?.likes_count || 0;
      const views = product.stats?.views || 0;
      const comments = product.stats?.comments_count || 0;

      totalLikes += likes;
      totalViews += views;
      totalComments += comments;

      if (product.status === ProductStatus.APPROVED) {
        statusBreakdown.active += 1;
        if ((product.inventory_count || 0) === 0) {
          soldOutProducts += 1;
        }
      } else if (product.status === ProductStatus.REJECTED) {
        statusBreakdown.rejected += 1;
      } else if (product.status === ProductStatus.DRAFT) {
        statusBreakdown.draft += 1;
      } else {
        statusBreakdown.pending += 1;
      }

      const mappedStatus: 'Active' | 'Pending' | 'Draft' | 'Rejected' =
        product.status === ProductStatus.APPROVED
          ? 'Active'
          : product.status === ProductStatus.REJECTED
            ? 'Rejected'
            : product.status === ProductStatus.DRAFT
              ? 'Draft'
              : 'Pending';

      if (
        !topProduct ||
        views > topProduct.views ||
        (views === topProduct.views && likes > topProduct.likes)
      ) {
        topProduct = {
          title: product.title,
          imageUrl: product.images[0]?.url || null,
          status: mappedStatus,
          likes,
          views,
          priceCents: product.price_cents,
        };
      }
    }

    const earningsCents = this.decimalToCents(deliveredSales._sum.total_price);
    const soldUnits = deliveredSales._sum.quantity || 0;
    const lastUploadDaysAgo =
      products[0]?.created_at != null
        ? Math.floor(
            (Date.now() - new Date(products[0].created_at).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

    return {
      totalProducts,
      totalLikes,
      totalViews,
      totalComments,
      totalUploads: totalProducts,
      uploads: totalProducts,
      likes: totalLikes,
      earningsCents,
      revenueLastMonthCents: earningsCents,
      soldUnits,
      averagePriceCents:
        totalProducts > 0 ? Math.round(totalPriceCents / totalProducts) : 0,
      totalInventoryUnits,
      soldOutProducts,
      productLimit: 30,
      remainingSlots: Math.max(0, 30 - totalProducts),
      currency: products[0]?.currency || 'INR',
      statusBreakdown,
      latestImages,
      lastUploadDaysAgo,
      topProduct,
    };
  }

  async getCreatorProducts(
    userId: string,
    page: number = 1,
    limit: number = 10,
    groupId?: string,
  ) {
    const creatorId = await this.getCreatorIdFromUserId(userId);
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ProductWhereInput = {
      creator_id: creatorId,
      is_deleted: false,
    };

    if (groupId) {
      whereClause.group_assignments = {
        some: {
          group_id: groupId,
        },
      };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        include: {
          stats: true,
          images: {
            orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
          },
          approvals: {
            orderBy: { created_at: 'desc' },
            take: 1,
            select: {
              approval_id: true,
              status: true,
              comment: true,
              actioned_at: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: Number(limit),
      }),
      this.prisma.product.count({
        where: whereClause,
      }),
    ]);

    const mappedProducts = products.map((product) => {
      const primaryImage =
        product.images.find((img) => img.is_primary) || product.images[0];
      const imageUrl = primaryImage?.url || null;

      let tags: Array<{ name: string }> = [];
      try {
        if (product.description) {
          const parsed = JSON.parse(product.description);
          if (parsed.tags && Array.isArray(parsed.tags)) {
            tags = parsed.tags;
          }
        }
      } catch {
        // Description is not JSON, ignore
      }

      const triesCount = product.stats?.views || 0;
      const conversionRate =
        triesCount > 0
          ? ((product.stats?.likes_count || 0) / triesCount) * 100
          : 0;

      // Get latest approval feedback (if any)
      const latestApproval = product.approvals[0];
      const isRejected = product.status === ProductStatus.REJECTED;
      const rejectionReason =
        isRejected && latestApproval?.comment
          ? latestApproval.comment
          : undefined;

      return {
        product_id: product.product_id,
        name: product.title,
        title: product.title,
        description: product.description,
        image_url: imageUrl,
        images: product.images.map((img) => ({
          image_id: img.image_id,
          url: img.url,
          is_primary: img.is_primary,
          order_index: img.order_index,
        })),
        category: product.category,
        category_id: product.category_id,
        sub_category_id: product.sub_category_id,
        price_cents: product.price_cents,
        currency: product.currency,
        inventory_count: product.inventory_count,
        status:
          product.status === ProductStatus.APPROVED
            ? 'Active'
            : product.status === ProductStatus.REJECTED
              ? 'Rejected'
              : product.status === ProductStatus.DRAFT
                ? 'Draft'
                : 'Pending',
        rejectionReason, // Only present if status is REJECTED
        tags: tags,
        metadata: (product as any).metadata || {},
        // Dedicated attribute columns
        occasions: (product as any).occasions || [],
        body_shapes: (product as any).body_shapes || [],
        skin_tones: (product as any).skin_tones || [],
        sizes: (product as any).sizes || [],
        age_ranges: (product as any).age_ranges || [],
        stats: {
          likes_count: product.stats?.likes_count || 0,
          tries_count: triesCount,
          conversion_rate: Math.round(conversionRate * 100) / 100,
          views: product.stats?.views || 0,
          comments_count: product.stats?.comments_count || 0,
        },
        created_at: product.created_at,
        updated_at: product.updated_at,
      };
    });

    return {
      data: mappedProducts,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Build recommendation metadata from DTO attribute arrays
   */
  private buildMetadata(dto: Partial<CreateProductDto>, existingMetadata?: any): any {
    const metadata = existingMetadata ? { ...existingMetadata } : {};

    if (dto.occasions !== undefined) metadata.occasions = dto.occasions;
    if (dto.body_shapes !== undefined) metadata.body_shapes = dto.body_shapes;
    if (dto.skin_tones !== undefined) metadata.skin_tones = dto.skin_tones;
    if (dto.sizes !== undefined) metadata.sizes = dto.sizes;
    if (dto.age_ranges !== undefined) metadata.age_ranges = dto.age_ranges;

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }

  async createProduct(userId: string, dto: CreateProductDto) {
    const creatorId = await this.getCreatorIdFromUserId(userId);

    // ── Enforce product upload limit ──────────────────────────────────
    const limits = await this.prisma.creatorLimit.findUnique({
      where: { creator_id: creatorId },
    });
    const maxProducts = limits?.max_products ?? 30;

    const currentCount = await this.prisma.product.count({
      where: { creator_id: creatorId, is_deleted: false },
    });

    if (currentCount >= maxProducts) {
      throw new BadRequestException(
        `You have reached the maximum limit of ${maxProducts} products. Please delete an existing product before uploading a new one.`,
      );
    }
    // ─────────────────────────────────────────────────────────────────

    const slug = `${dto.title.toLowerCase().replace(/\s+/g, '-')}-${nanoid(6)}`;

    // Build recommendation metadata from attribute fields
    const metadata = this.buildMetadata(dto);

    // Resolve category display string (legacy `product.category`) from category_id
    const categoryName = dto.category_id
      ? (
          await this.prisma.category.findUnique({
            where: { category_id: dto.category_id },
            select: { name: true },
          })
        )?.name ?? null
      : null;

    const product = await this.prisma.product.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description || '',
        price_cents: dto.price_cents,
        currency: dto.currency || 'INR',
        inventory_count: dto.inventory_count || 0,
        creator: { connect: { creator_id: creatorId } },
        status: ProductStatus.DRAFT, // Start as DRAFT
        category: categoryName ?? undefined,
        category_rel: dto.category_id
          ? { connect: { category_id: dto.category_id } }
          : undefined,
        sub_category_rel: dto.sub_category_id
          ? { connect: { sub_category_id: dto.sub_category_id } }
          : undefined,
        ...(metadata ? { metadata } : {}),
        // Store in dedicated columns
        occasions: dto.occasions || [],
        body_shapes: dto.body_shapes || [],
        skin_tones: dto.skin_tones || [],
        sizes: dto.sizes || [],
        age_ranges: dto.age_ranges || [],
      },
    });

    if (dto.group_ids && dto.group_ids.length > 0) {
      this.logger.log(`Assigning product ${product.product_id} to ${dto.group_ids.length} groups`);
      await this.prisma.productGroupAssignment.createMany({
        data: dto.group_ids.map((groupId) => ({
          product_id: product.product_id,
          group_id: groupId,
        })),
      });
    }

    // Handle new image uploads (raw/base64)
    if (dto.images && Array.isArray(dto.images)) {
      this.logger.log(
        `Received ${dto.images.length} images for product ${product.product_id}`,
      );
      await Promise.all(
        dto.images.map(async (image, index) => {
          try {
            const formattedImage = image.startsWith('data:')
              ? image
              : `data:image/jpeg;base64,${image}`;

            this.logger.log(
              `Uploading image ${index + 1}/${dto.images?.length || 0} for product ${product.product_id}`,
            );
            const uploadedUrl =
              await this.cloudinaryService.uploadImage(formattedImage);

            this.logger.log(`Image uploaded successfully: ${uploadedUrl}`);

            await this.prisma.productImage.create({
              data: {
                product_id: product.product_id,
                url: uploadedUrl,
                order_index: index,
                is_primary: index === 0,
              },
            });
            this.logger.log(`Product image record created for ${uploadedUrl}`);
          } catch (error) {
            this.logger.error(
              `Failed to upload image ${index}: ${error.message}`,
              error.stack,
            );
            throw new BadRequestException(`Failed to upload image`);
          }
        }),
      );
    } else {
      this.logger.warn(`No images received for product ${product.product_id}`);
    }

    return product;
  }

  async updateProduct(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
  ) {
    const creatorId = await this.getCreatorIdFromUserId(userId);

    // Verify product belongs to creator
    const product = await this.prisma.product.findUnique({
      where: { product_id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.creator_id !== creatorId) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    if (product.is_deleted) {
      throw new BadRequestException('Cannot update a deleted product');
    }

    // Prepare update data
    const updateData: Prisma.ProductUpdateInput = {
      updated_at: new Date(),
    };

    // Category mapping updates
    if (dto.category_id !== undefined) {
      const categoryName = dto.category_id
        ? (
            await this.prisma.category.findUnique({
              where: { category_id: dto.category_id },
              select: { name: true },
            })
          )?.name ?? null
        : null;

      updateData.category = categoryName ?? undefined;
      updateData.category_rel = dto.category_id
        ? { connect: { category_id: dto.category_id } }
        : { disconnect: true };
    }

    if (dto.sub_category_id !== undefined) {
      updateData.sub_category_rel = dto.sub_category_id
        ? { connect: { sub_category_id: dto.sub_category_id } }
        : { disconnect: true };
    }

    if (dto.title) {
      updateData.title = dto.title;
      // Regenerate slug if title changed
      const baseSlug = this.slugify(dto.title);
      let slug = baseSlug;
      let i = 1;
      while (
        await this.prisma.product.findFirst({
          where: { slug, product_id: { not: productId } },
        })
      ) {
        slug = `${baseSlug}-${i++}`;
      }
      updateData.slug = slug;
    }

    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }

    if (dto.price_cents !== undefined) {
      updateData.price_cents = dto.price_cents;
    }

    if (dto.currency !== undefined) {
      updateData.currency = dto.currency;
    }

    if (dto.inventory_count !== undefined) {
      updateData.inventory_count = dto.inventory_count;
    }

    if (dto.status) {
      updateData.status = dto.status;
    }

    // Handle tags - store in description as JSON
    if (dto.tags !== undefined) {
      let description = dto.description || product.description || '';
      if (dto.tags.length > 0) {
        const tagMetadata = {
          tags: dto.tags,
          ...(description && !description.startsWith('{')
            ? { originalDescription: description }
            : {}),
        };
        description = JSON.stringify(tagMetadata);
      }
      updateData.description = description;
    }

    // Handle recommendation attributes — update dedicated columns + metadata
    const hasAttributeUpdates =
      dto.occasions !== undefined ||
      dto.body_shapes !== undefined ||
      dto.skin_tones !== undefined ||
      dto.sizes !== undefined ||
      dto.age_ranges !== undefined;

    if (hasAttributeUpdates) {
      const existingMetadata = (product.metadata as any) || {};
      updateData.metadata = this.buildMetadata(dto, existingMetadata);
      // Write to dedicated columns
      if (dto.occasions !== undefined) updateData.occasions = dto.occasions;
      if (dto.body_shapes !== undefined) updateData.body_shapes = dto.body_shapes;
      if (dto.skin_tones !== undefined) updateData.skin_tones = dto.skin_tones;
      if (dto.sizes !== undefined) updateData.sizes = dto.sizes;
      if (dto.age_ranges !== undefined) updateData.age_ranges = dto.age_ranges;
    }

    // Handle image updates
    if (dto.images && Array.isArray(dto.images)) {
      this.logger.log(
        `Updating images for product ${productId}. Received ${dto.images.length} images.`,
      );

      // 1. Delete existing images
      await this.prisma.productImage.deleteMany({
        where: { product_id: productId },
      });

      // 2. Upload/Process new images
      await Promise.all(
        dto.images.map(async (image, index) => {
          try {
            let imageUrl = image;

            // If it's a base64 string, upload to Cloudinary
            if (image.startsWith('data:')) {
              this.logger.log(
                `Uploading new image ${index + 1}/${dto.images?.length} for product ${productId}`,
              );
              imageUrl = await this.cloudinaryService.uploadImage(image);
            }

            // Create new image record
            await this.prisma.productImage.create({
              data: {
                product_id: productId,
                url: imageUrl,
                order_index: index,
                is_primary: index === 0,
              },
            });
          } catch (error) {
            this.logger.error(
              `Failed to process image ${index} during update: ${error.message}`,
              error.stack,
            );
            // Continue with other images even if one fails? Or throw?
            // For now, let's log and continue to avoid breaking the whole update
          }
        }),
      );
    }

    // Update product
    const updatedProduct = await this.prisma.product.update({
      where: { product_id: productId },
      data: updateData,
    });

    // Update group assignments if provided
    if (dto.group_ids !== undefined) {
      this.logger.log(`Updating group assignments for product ${productId}. Received ${dto.group_ids.length} groups.`);
      
      // 1. Delete existing assignments
      await this.prisma.productGroupAssignment.deleteMany({
        where: { product_id: productId },
      });

      // 2. Create new assignments
      if (dto.group_ids.length > 0) {
        await this.prisma.productGroupAssignment.createMany({
          data: dto.group_ids.map((groupId) => ({
            product_id: productId,
            group_id: groupId,
          })),
        });
      }
    }

    return this.getProductById(updatedProduct.product_id, creatorId);
  }

  async deleteProduct(userId: string, productId: string) {
    const creatorId = await this.getCreatorIdFromUserId(userId);

    // Verify product belongs to creator
    const product = await this.prisma.product.findUnique({
      where: { product_id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.creator_id !== creatorId) {
      throw new ForbiddenException(
        'You do not have permission to delete this product',
      );
    }

    // Soft delete
    await this.prisma.product.update({
      where: { product_id: productId },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });

    // Get updated metrics
    const metrics = await this.getCreatorDashboardMetrics(userId);

    return {
      message: 'Product deleted successfully',
      totalUploads: metrics.totalUploads,
      latestImages: metrics.latestImages,
    };
  }

  async updateCreatorProfile(userId: string, dto: any) {
    const creatorId = await this.getCreatorIdFromUserId(userId);

    const creator = await this.prisma.creator.findUnique({
      where: { creator_id: creatorId },
    });

    if (!creator) {
      throw new NotFoundException('Creator profile not found');
    }

    let avatarUrl = dto.avatar;
    // Handle avatar upload if base64
    if (dto.avatar && dto.avatar.startsWith('data:')) {
      this.logger.log(`Uploading avatar for creator ${creatorId}`);
      try {
        avatarUrl = await this.cloudinaryService.uploadImage(dto.avatar);
      } catch (error) {
        this.logger.error(`Failed to upload avatar: ${error.message}`);
        throw new BadRequestException('Failed to upload avatar');
      }
    }

    // Prepare update data
    const currentVerificationData = (creator.verification_data as any) || {};
    const currentPaymentDetails = currentVerificationData.paymentDetails || {};
    const isUpdatingPaymentDetails =
      dto.paymentBeneficiaryName !== undefined || dto.paymentUpiId !== undefined;
    let paymentDetails = currentPaymentDetails;

    if (isUpdatingPaymentDetails) {
      const beneficiaryName =
        dto.paymentBeneficiaryName !== undefined
          ? this.normalizePayoutBeneficiaryName(dto.paymentBeneficiaryName)
          : this.normalizePayoutBeneficiaryName(
              currentPaymentDetails.beneficiaryName,
            );
      const upiId =
        dto.paymentUpiId !== undefined
          ? dto.paymentUpiId.trim().toLowerCase()
          : currentPaymentDetails.upiId || '';
      const currentBeneficiaryName = this.normalizePayoutBeneficiaryName(
        currentPaymentDetails.beneficiaryName,
      );
      const currentUpiId =
        typeof currentPaymentDetails.upiId === 'string'
          ? currentPaymentDetails.upiId.trim().toLowerCase()
          : '';

      const isClearingPaymentDetails = beneficiaryName === '' && upiId === '';
      const isSamePaymentDetails =
        !isClearingPaymentDetails &&
        beneficiaryName === currentBeneficiaryName &&
        upiId === currentUpiId;

      if (!isClearingPaymentDetails) {
        if (!beneficiaryName || !upiId) {
          throw new BadRequestException(
            'Both beneficiary name and UPI ID are required to save creator payout details.',
          );
        }

        if (!UPI_ID_REGEX.test(upiId)) {
          throw new BadRequestException(
            'Enter a valid UPI ID in the format name@upi.',
          );
        }
      }

      if (isClearingPaymentDetails) {
        paymentDetails = undefined;
      } else if (isSamePaymentDetails) {
        paymentDetails = {
          ...currentPaymentDetails,
          gateway: currentPaymentDetails.gateway || CREATOR_PAYOUT_GATEWAY,
          method: currentPaymentDetails.method || CREATOR_PAYOUT_METHOD,
          beneficiaryName,
          upiId,
          updatedAt: new Date().toISOString(),
        };
      } else {
        const verification = await this.payUVpaService.verifyUpiId(upiId);
        const resolvedBeneficiaryName = this.resolvePayoutBeneficiaryName(
          beneficiaryName,
          verification.payerAccountName,
        );

        if (!resolvedBeneficiaryName) {
          throw new BadRequestException(
            'PayU verified the UPI ID, but the account holder name was not returned. Enter the beneficiary name manually and try again.',
          );
        }

        paymentDetails = {
          gateway: CREATOR_PAYOUT_GATEWAY,
          method: CREATOR_PAYOUT_METHOD,
          beneficiaryName: resolvedBeneficiaryName,
          upiId: verification.upiId,
          verifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    const newVerificationData = {
      ...currentVerificationData,
      ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle } : {}),
      ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {}),
    };

    if (isUpdatingPaymentDetails) {
      if (paymentDetails) {
        newVerificationData.paymentDetails = paymentDetails;
      } else {
        delete newVerificationData.paymentDetails;
      }
    }

    const updateData: Prisma.CreatorUpdateInput = {
      ...(dto.name ? { store_name: dto.name } : {}),
      verification_data: newVerificationData,
    };

    const updatedCreator = await this.prisma.creator.update({
      where: { creator_id: creatorId },
      data: updateData,
    });

    return {
      name: updatedCreator.store_name,
      subtitle: newVerificationData.subtitle,
      avatar: newVerificationData.avatar,
      paymentDetails: newVerificationData.paymentDetails || null,
    };
  }

  async getCreatorProfile(userId: string) {
    const creatorId = await this.getCreatorIdFromUserId(userId);
    const creator = await this.prisma.creator.findUnique({
      where: { creator_id: creatorId },
      include: { user: true },
    });

    if (!creator) {
      throw new NotFoundException('Creator profile not found');
    }

    const verificationData = (creator.verification_data as any) || {};

    return {
      name: creator.store_name,
      subtitle: verificationData.subtitle || creator.about || 'Creator',
      avatar:
        verificationData.avatar ||
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
      role: creator.user.role,
      paymentDetails: verificationData.paymentDetails || null,
    };
  }

  private async getProductById(productId: string, creatorId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        product_id: productId,
        creator_id: creatorId,
      },
      include: {
        stats: true,
        images: {
          orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const primaryImage =
      product.images.find((img) => img.is_primary) || product.images[0];
    const imageUrl = primaryImage?.url || null;

    let tags: Array<{ name: string }> = [];
    try {
      if (product.description) {
        const parsed = JSON.parse(product.description);
        if (parsed.tags && Array.isArray(parsed.tags)) {
          tags = parsed.tags;
        }
      }
    } catch {
      // Description is not JSON, ignore
    }

    const triesCount = product.stats?.views || 0;
    const conversionRate =
      triesCount > 0
        ? ((product.stats?.likes_count || 0) / triesCount) * 100
        : 0;

    return {
      product_id: product.product_id,
      name: product.title,
      title: product.title,
      description: product.description,
      image_url: imageUrl,
      images: product.images.map((img) => ({
        image_id: img.image_id,
        url: img.url,
        is_primary: img.is_primary,
        order_index: img.order_index,
      })),
      category: product.category,
      category_id: product.category_id,
      sub_category_id: product.sub_category_id,
      price_cents: product.price_cents,
      currency: product.currency,
      inventory_count: product.inventory_count,
      status:
        product.status === ProductStatus.APPROVED
          ? 'Active'
          : product.status === ProductStatus.DRAFT
            ? 'Draft'
            : 'Pending',
      tags: tags,
      metadata: (product as any).metadata || {},
      occasions: product.occasions || [],
      body_shapes: product.body_shapes || [],
      skin_tones: product.skin_tones || [],
      sizes: product.sizes || [],
      age_ranges: product.age_ranges || [],
      stats: {
        likes_count: product.stats?.likes_count || 0,
        tries_count: triesCount,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        views: product.stats?.views || 0,
        comments_count: product.stats?.comments_count || 0,
      },
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  }

  /**
   * Publish a product (DRAFT → PENDING)
   * Submits product for admin approval
   */
  async publishProduct(userId: string, productId: string) {
    const creatorId = await this.getCreatorIdFromUserId(userId);

    // Find the product
    const product = await this.prisma.product.findFirst({
      where: {
        product_id: productId,
        creator_id: creatorId,
        is_deleted: false,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is in DRAFT status
    if (product.status !== ProductStatus.DRAFT) {
      throw new BadRequestException(
        `Product cannot be published. Current status: ${product.status}`,
      );
    }

    // Update status to PENDING
    const updatedProduct = await this.prisma.product.update({
      where: { product_id: productId },
      data: {
        status: ProductStatus.PENDING,
        updated_at: new Date(),
      },
    });

    this.logger.log(
      `Product ${productId} published by creator ${creatorId}. Status: DRAFT → PENDING`,
    );

    return {
      product_id: updatedProduct.product_id,
      status: updatedProduct.status,
      message: 'Product submitted for approval',
    };
  }
}
