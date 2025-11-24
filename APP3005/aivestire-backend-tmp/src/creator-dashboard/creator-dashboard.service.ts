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
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '../common/cloudinary.service';
import { nanoid } from 'nanoid';

@Injectable()
export class CreatorDashboardService {
  private readonly logger = new Logger(CreatorDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
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
      throw new NotFoundException('Creator profile not found');
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

  async getCreatorDashboardMetrics(userId: string) {
    const creatorId = await this.getCreatorIdFromUserId(userId);
    const products = await this.prisma.product.findMany({
      where: { creator_id: creatorId },
      include: {
        stats: true,
        reviews: true,
        orders: true,
      },
    });

    let totalLikes = 0;
    let totalReviews = 0;
    let totalSalesCents = 0;
    let totalRating = 0;
    let ratedReviewsCount = 0;

    for (const product of products) {
      if (product.stats) {
        totalLikes += product.stats.likes_count;
      }
      totalReviews += product.reviews.length;
      totalSalesCents += product.orders.reduce(
        (sum, order) => sum + order.total_price_cents,
        0,
      );

      const ratings = product.reviews
        .map((r) => r.rating)
        .filter((r): r is number => r !== null);
      if (ratings.length > 0) {
        totalRating += ratings.reduce((sum, r) => sum + r, 0);
        ratedReviewsCount += ratings.length;
      }
    }

    const averageRating =
      ratedReviewsCount > 0 ? totalRating / ratedReviewsCount : 0;
    const totalUploads = products.length;

    // For ranking, we'll need to calculate total sales for all creators and then rank them.
    // This can be a separate, more complex query or a cached value.
    // For now, we'll just return the individual creator's metrics.

    return {
      totalLikes,
      totalReviews,
      totalSalesCents,
      totalUploads,
      averageRating,
      // ranking: calculated separately
    };
  }

  async getCreatorReviews(userId: string) {
    const creatorId = await this.getCreatorIdFromUserId(userId);
    const products = await this.prisma.product.findMany({
      where: { creator_id: creatorId },
      include: { reviews: true },
    });
    return products.flatMap((p) => p.reviews);
  }

  async getSalesByMonth(userId: string) {
    const creatorId = await this.getCreatorIdFromUserId(userId);
    const products = await this.prisma.product.findMany({
      where: { creator_id: creatorId },
      include: { orders: true },
    });
    const totals = new Map<string, number>();
    for (const p of products) {
      for (const o of p.orders) {
        const d = new Date(o.created_at as unknown as string);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        totals.set(key, (totals.get(key) ?? 0) + o.total_price_cents);
      }
    }
    return Array.from(totals.entries()).map(([month, total_cents]) => ({
      month,
      total_cents,
    }));
  }

  async getCreatorProducts(userId: string) {
    const creatorId = await this.getCreatorIdFromUserId(userId);
    const products = await this.prisma.product.findMany({
      where: {
        creator_id: creatorId,
        is_deleted: false,
      },
      include: {
        stats: true,
        images: {
          orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Transform products to match frontend expectations
    return products.map((product) => {
      const primaryImage =
        product.images.find((img) => img.is_primary) || product.images[0];
      const imageUrl = primaryImage?.url || null;

      // Parse tags from description or use empty array
      // For now, we'll store tags as JSON in a metadata field or use description
      // Since tags aren't in the schema, we'll extract them from a JSON field in description
      // or return empty array for now
      let tags: Array<{ name: string }> = [];
      try {
        // Try to parse tags from description if it's JSON
        if (product.description) {
          const parsed = JSON.parse(product.description);
          if (parsed.tags && Array.isArray(parsed.tags)) {
            tags = parsed.tags;
          }
        }
      } catch {
        // Description is not JSON, ignore
      }

      // Calculate conversion rate (tries to purchases ratio)
      // For now, we'll use a placeholder calculation
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
        price_cents: product.price_cents,
        currency: product.currency,
        inventory_count: product.inventory_count,
        status: product.status === 'approved' ? 'Active' : 'Pending',
        tags: tags,
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
  }

  async createProduct(userId: string, dto: CreateProductDto) {
    const slug = `${dto.title.toLowerCase().replace(/\s+/g, '-')}-${nanoid(6)}`;

    const product = await this.prisma.product.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description || '',
        price_cents: dto.price_cents,
        currency: dto.currency || 'INR',
        inventory_count: dto.inventory_count || 0,
        creator_id: userId,
      },
    });

    // Handle new image uploads (raw/base64)
    if (dto.images && Array.isArray(dto.images)) {
      await Promise.all(
        dto.images.map(async (image, index) => {
          try {
            const uploadedUrl = await this.cloudinaryService.uploadImage(image);
            await this.prisma.productImage.create({
              data: {
                product_id: product.product_id,
                url: uploadedUrl,
                order_index: index,
              },
            });
          } catch {
            throw new BadRequestException(`Failed to upload image`);
          }
        }),
      );
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
        const metadata = {
          tags: dto.tags,
          ...(description && !description.startsWith('{')
            ? { originalDescription: description }
            : {}),
        };
        description = JSON.stringify(metadata);
      }
      updateData.description = description;
    }

    // Update product
    const updatedProduct = await this.prisma.product.update({
      where: { product_id: productId },
      data: updateData,
    });

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

    return { message: 'Product deleted successfully' };
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
      price_cents: product.price_cents,
      currency: product.currency,
      inventory_count: product.inventory_count,
      status: product.status === 'approved' ? 'Active' : 'Pending',
      tags: tags,
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
}
