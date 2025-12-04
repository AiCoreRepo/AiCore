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
import { Prisma, UserRole, ProductStatus } from '@prisma/client';
import { CloudinaryService } from '../common/cloudinary.service';
import { nanoid } from 'nanoid';

@Injectable()
export class CreatorDashboardService {
  private readonly logger = new Logger(CreatorDashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

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

  async getCreatorDashboardMetrics(userId: string) {
    const creatorId = await this.getCreatorIdFromUserId(userId);
    const products = await this.prisma.product.findMany({
      where: {
        creator_id: creatorId,
        is_deleted: false
      },
      include: {
        stats: true,
        images: {
          where: { is_primary: true },
          take: 1
        }
      },
      orderBy: { created_at: 'desc' }
    });

    let totalLikes = 0;
    const totalUploads = products.length;

    // Get latest 3 images
    const latestImages = products
      .slice(0, 3)
      .map(p => p.images[0]?.url)
      .filter(url => url !== undefined);

    for (const product of products) {
      if (product.stats) {
        totalLikes += product.stats.likes_count;
      }
    }

    return {
      totalLikes,
      totalUploads,
      latestImages
    };
  }

  async getCreatorProducts(userId: string, page: number = 1, limit: number = 10) {
    const creatorId = await this.getCreatorIdFromUserId(userId);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
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
        skip,
        take: Number(limit),
      }),
      this.prisma.product.count({
        where: {
          creator_id: creatorId,
          is_deleted: false,
        },
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

      return {
        product_id: product.product_id,
        name: product.title,
        title: product.title,
        description: product.description,
        image_url: imageUrl,
        images: product.images.map(img => img.url),
        price_cents: product.price_cents,
        currency: product.currency,
        inventory_count: product.inventory_count,
        status: product.status === ProductStatus.APPROVED ? 'Active' : 'Pending',
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

  async createProduct(userId: string, dto: CreateProductDto) {
    const creatorId = await this.getCreatorIdFromUserId(userId);
    const slug = `${dto.title.toLowerCase().replace(/\s+/g, '-')}-${nanoid(6)}`;

    const product = await this.prisma.product.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description || '',
        price_cents: dto.price_cents,
        currency: dto.currency || 'INR',
        inventory_count: dto.inventory_count || 0,
        creator_id: creatorId,
      },
    });

    // Handle new image uploads (raw/base64)
    if (dto.images && Array.isArray(dto.images)) {
      this.logger.log(`Received ${dto.images.length} images for product ${product.product_id}`);
      await Promise.all(
        dto.images.map(async (image, index) => {
          try {
            const formattedImage = image.startsWith('data:')
              ? image
              : `data:image/jpeg;base64,${image}`;

            this.logger.log(`Uploading image ${index + 1}/${dto.images?.length || 0} for product ${product.product_id}`);
            const uploadedUrl =
              await this.cloudinaryService.uploadImage(formattedImage);

            this.logger.log(`Image uploaded successfully: ${uploadedUrl}`);

            await this.prisma.productImage.create({
              data: {
                product_id: product.product_id,
                url: uploadedUrl,
                order_index: index,
              },
            });
            this.logger.log(`Product image record created for ${uploadedUrl}`);
          } catch (error) {
            this.logger.error(`Failed to upload image ${index}: ${error.message}`, error.stack);
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

    // Handle image updates
    if (dto.images && Array.isArray(dto.images)) {
      this.logger.log(`Updating images for product ${productId}. Received ${dto.images.length} images.`);

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
              this.logger.log(`Uploading new image ${index + 1}/${dto.images?.length} for product ${productId}`);
              imageUrl = await this.cloudinaryService.uploadImage(image);
            }

            // Create new image record
            await this.prisma.productImage.create({
              data: {
                product_id: productId,
                url: imageUrl,
                order_index: index,
              },
            });
          } catch (error) {
            this.logger.error(`Failed to process image ${index} during update: ${error.message}`, error.stack);
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
      latestImages: metrics.latestImages
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
    const newVerificationData = {
      ...currentVerificationData,
      ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle } : {}),
      ...(avatarUrl !== undefined ? { avatar: avatarUrl } : {}),
    };

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
      avatar: verificationData.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
      role: creator.user.role,
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
      price_cents: product.price_cents,
      currency: product.currency,
      inventory_count: product.inventory_count,
      status: product.status === ProductStatus.APPROVED ? 'Active' : 'Pending',
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
