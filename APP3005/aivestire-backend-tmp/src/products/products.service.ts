import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma, ProductStatus, ApprovalStatus } from '@prisma/client';
import { CloudinaryService } from '../common/cloudinary.service';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) { }

  async create(dto: CreateProductDto) {
    try {
      const baseSlug = dto.slug ? slugify(dto.slug) : slugify(dto.title);
      let slug = baseSlug;
      let i = 1;
      while (await this.prisma.product.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`;
      }

      const imageUrls: { url: string }[] = [];
      if (dto.images && Array.isArray(dto.images) && dto.images.length > 0) {
        for (const base64Image of dto.images) {
          const uploadedUrl =
            await this.cloudinaryService.uploadImage(base64Image);
          imageUrls.push({ url: uploadedUrl });
        }
      }

      const data: Prisma.ProductCreateInput = {
        title: dto.title,
        slug,
        description: dto.description,
        price_cents: dto.price_cents,
        currency: dto.currency ?? undefined,
        inventory_count: dto.inventory_count ?? undefined,
        creator: { connect: { creator_id: dto.creator_id } },
        images: {
          create: imageUrls.map((image, index) => ({
            url: image.url,
            order_index: index,
            is_primary: index === 0, // Set the first image as primary
          })),
        },
      };
      return await this.prisma.product.create({ data });
    } catch (e: unknown) {
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Unknown error',
      );
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    try {
      const updateData: Prisma.ProductUpdateInput = {
        title: dto.title,
        description: dto.description,
        price_cents: dto.price_cents,
        currency: dto.currency,
        inventory_count: dto.inventory_count,
        slug: dto.slug,
      };

      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key],
      );

      if (dto.images && Array.isArray(dto.images) && dto.images.length > 0) {
        await this.prisma.productImage.deleteMany({
          where: { product_id: id },
        });

        await Promise.all(
          dto.images.map(async (base64Image, index) => {
            const uploadedUrl =
              await this.cloudinaryService.uploadImage(base64Image);
            await this.prisma.productImage.create({
              data: {
                product_id: id,
                url: uploadedUrl,
                order_index: index,
                is_primary: index === 0,
              },
            });
          }),
        );
      }

      return await this.prisma.product.update({
        where: { product_id: id },
        data: updateData,
      });
    } catch (e) {
      throw new NotFoundException('Product not found');
    }
  }

  async submitForApproval(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { product_id: id },
      });
      if (!product) throw new NotFoundException('Product not found');
      if (product.status !== ProductStatus.DRAFT)
        throw new BadRequestException('Only draft products can be submitted');

      await tx.product.update({
        where: { product_id: id },
        data: { status: ProductStatus.PENDING },
      });

      await tx.productApproval.create({
        data: {
          product_id: id,
          status: ApprovalStatus.PENDING,
        },
      });

      return { message: 'Product submitted for approval' };
    });
  }


  /**
   * Get approved products for public display (Collection page)
   * No authentication required
   * Implementing in-memory filtering for JSON metadata reliability
   */
  async getApprovedProducts(
    page: number = 1,
    limit: number = 20,
    search?: string,
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    sortBy?: string,
    sizes?: string,
    colors?: string,
  ) {
    // Fetch all approved products to filter in memory (efficient for < 5000 items)
    const allProducts = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.APPROVED,
        is_deleted: false,
      },
      include: {
        creator: {
          select: {
            creator_id: true,
            store_name: true,
            verified: true,
          },
        },
        images: {
          orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
        },
        stats: {
          select: {
            views: true,
            likes_count: true,
            comments_count: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    let filtered = allProducts;

    // 1. Search Filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower),
      );
    }

    // 2. Category Filter
    if (category && category !== 'All') {
      filtered = filtered.filter((p) => p.category === category);
    }

    // 3. Price Filter
    if (minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price_cents >= minPrice * 100);
    }
    if (maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price_cents <= maxPrice * 100);
    }

    // 4. Size Filter (from JSON metadata)
    if (sizes) {
      const sizeList = sizes.split(',').map((s) => s.trim().toLowerCase());
      filtered = filtered.filter((p) => {
        const meta = p.metadata as any;
        if (!meta || !meta.size) return false;
        // Check if product size string contains any of the selected sizes
        // meta.size might be "S, M, L" string
        const productSizes = String(meta.size).toLowerCase();
        return sizeList.some((s) => productSizes.includes(s));
      });
    }

    // 5. Color Filter (from JSON metadata)
    if (colors) {
      const colorList = colors.split(',').map((c) => c.trim().toLowerCase());
      filtered = filtered.filter((p) => {
        const meta = p.metadata as any;
        if (!meta || !meta.color) return false;
        const productColors = String(meta.color).toLowerCase();
        return colorList.some((c) => productColors.includes(c));
      });
    }

    // 6. Sorting
    if (sortBy) {
      switch (sortBy) {
        case 'Price: Low to High':
          filtered.sort((a, b) => a.price_cents - b.price_cents);
          break;
        case 'Price: High to Low':
          filtered.sort((a, b) => b.price_cents - a.price_cents);
          break;
        case 'Most Popular':
          filtered.sort(
            (a, b) =>
              (b.stats?.likes_count || 0) - (a.stats?.likes_count || 0),
          );
          break;
        case 'Newest':
          filtered.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          break;
        default:
          // Default to updated_at desc (already sorted by DB query mostly, but ensure)
          break;
      }
    }

    // 7. Pagination
    const total = filtered.length;
    const skip = (page - 1) * limit;
    const paginatedProducts = filtered.slice(skip, skip + limit);

    return {
      products: paginatedProducts.map((product) => ({
        product_id: product.product_id,
        title: product.title,
        description: product.description,
        price_cents: product.price_cents,
        currency: product.currency,
        thumbnail: product.images[0]?.url || null,
        images: product.images.map((img) => ({
          url: img.url,
          is_primary: img.is_primary,
          order_index: img.order_index,
        })),
        category: product.category,
        is_featured: product.is_featured,
        likes: product.stats?.likes_count || 0,
        reviews: product.stats?.comments_count || 0,
        views: product.stats?.views || 0,
        creator: {
          creator_id: product.creator.creator_id,
          store_name: product.creator.store_name,
          verified: product.creator.verified,
        },
        metadata: product.metadata,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Like or unlike a product
   */
  async likeProduct(userId: string, productId: string) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { product_id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already liked
    const existingLike = await this.prisma.productLike.findUnique({
      where: {
        product_id_user_id: {
          product_id: productId,
          user_id: userId,
        },
      },
    });

    if (existingLike) {
      // Unlike - remove the like
      await this.prisma.productLike.delete({
        where: { like_id: existingLike.like_id },
      });

      // Update stats
      await this.prisma.productStat.upsert({
        where: { product_id: productId },
        update: { likes_count: { decrement: 1 } },
        create: { product_id: productId, likes_count: 0 },
      });

      return { liked: false, message: 'Product unliked' };
    } else {
      // Like - create new like
      await this.prisma.productLike.create({
        data: {
          product_id: productId,
          user_id: userId,
        },
      });

      // Update stats
      await this.prisma.productStat.upsert({
        where: { product_id: productId },
        update: { likes_count: { increment: 1 } },
        create: { product_id: productId, likes_count: 1 },
      });

      return { liked: true, message: 'Product liked' };
    }
  }

  /**
   * Add a comment to a product
   */
  async addComment(userId: string, productId: string, commentText: string, images?: string[]) {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { product_id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Upload images to Cloudinary if provided
    const imageUrls: string[] = [];
    if (images && Array.isArray(images) && images.length > 0) {
      // Limit to 5 images per comment
      const imagesToUpload = images.slice(0, 5);

      for (const base64Image of imagesToUpload) {
        try {
          const uploadedUrl = await this.cloudinaryService.uploadWithMetadata(
            base64Image,
            {
              userId,
              productId,
              imageType: 'review',
            },
            'review-images'  // Separate folder for review images
          );
          imageUrls.push(uploadedUrl.secureUrl);
        } catch (error) {
          console.error('Failed to upload review image:', error);
          // Continue with other images even if one fails
        }
      }
    }

    const comment = await this.prisma.productComment.create({
      data: {
        product_id: productId,
        user_id: userId,
        comment_text: commentText,
        image_urls: imageUrls,
      },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
          },
        },
      },
    });

    // Update stats
    await this.prisma.productStat.upsert({
      where: { product_id: productId },
      update: { comments_count: { increment: 1 } },
      create: { product_id: productId, comments_count: 1 },
    });

    return comment;
  }

  /**
   * Get product likes count and user's like status
   */
  async getProductLikes(productId: string, userId?: string) {
    const stats = await this.prisma.productStat.findUnique({
      where: { product_id: productId },
      select: { likes_count: true },
    });

    const likesCount = stats?.likes_count || 0;

    let isLikedByUser = false;
    if (userId) {
      const userLike = await this.prisma.productLike.findUnique({
        where: {
          product_id_user_id: {
            product_id: productId,
            user_id: userId,
          },
        },
      });
      isLikedByUser = !!userLike;
    }

    return { likesCount, isLikedByUser };
  }

  /**
   * Get product comments
   */
  async getProductComments(productId: string) {
    const comments = await this.prisma.productComment.findMany({
      where: { product_id: productId },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return comments;
  }

  /**
   * Delete a comment (only by comment owner or product creator)
   */
  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.productComment.findUnique({
      where: { comment_id: commentId },
      include: { product: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user is comment owner or product creator
    if (comment.user_id !== userId && comment.product.creator_id !== userId) {
      throw new BadRequestException(
        'You can only delete your own comments or comments on your products',
      );
    }

    await this.prisma.productComment.delete({
      where: { comment_id: commentId },
    });

    // Update stats
    await this.prisma.productStat.update({
      where: { product_id: comment.product_id },
      data: { comments_count: { decrement: 1 } },
    });

    return { message: 'Comment deleted successfully' };
  }
}
