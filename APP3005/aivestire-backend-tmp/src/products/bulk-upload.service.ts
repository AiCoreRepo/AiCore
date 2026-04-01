import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/cloudinary.service';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface BulkProductData {
  title: string;
  category: string;
  description?: string;
  price_cents: number;
  image_base64: string;
  occasions?: string[];
  body_shapes?: string[];
  skin_tones?: string[];
  sizes?: string[];
}

@Injectable()
export class BulkUploadService {
  private readonly logger = new Logger(BulkUploadService.name);
  private static readonly MAX_PRODUCTS_PER_BULK_UPLOAD = 10;
  private static readonly DEFAULT_MAX_PRODUCTS_PER_CREATOR = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async getCreatorIdFromUserId(userId: string): Promise<string> {
    const creator = await this.prisma.creator.findUnique({
      where: { user_id: userId },
      select: { creator_id: true },
    });

    if (!creator) {
      throw new NotFoundException(
        'Creator profile not found for this user. Please complete creator onboarding first.',
      );
    }

    return creator.creator_id;
  }

  async bulkCreateProducts(products: BulkProductData[], userId: string) {
    if (!Array.isArray(products) || products.length === 0) {
      throw new BadRequestException(
        'At least one product is required for bulk upload.',
      );
    }

    if (
      products.length > BulkUploadService.MAX_PRODUCTS_PER_BULK_UPLOAD
    ) {
      throw new BadRequestException(
        `Maximum ${BulkUploadService.MAX_PRODUCTS_PER_BULK_UPLOAD} products allowed per bulk upload.`,
      );
    }

    const creatorId = await this.getCreatorIdFromUserId(userId);
    const creatorLimit = await this.prisma.creatorLimit.findUnique({
      where: { creator_id: creatorId },
    });
    const maxProducts =
      creatorLimit?.max_products ??
      BulkUploadService.DEFAULT_MAX_PRODUCTS_PER_CREATOR;
    const currentCount = await this.prisma.product.count({
      where: {
        creator_id: creatorId,
        is_deleted: false,
      },
    });
    const remainingSlots = Math.max(maxProducts - currentCount, 0);

    if (products.length > remainingSlots) {
      throw new BadRequestException(
        remainingSlots === 0
          ? `You have reached the maximum limit of ${maxProducts} products. Please delete an existing product before uploading a new one.`
          : `This upload exceeds your creator limit. You can upload only ${remainingSlots} more product${remainingSlots === 1 ? '' : 's'} out of your ${maxProducts}-product limit.`,
      );
    }

    const results = {
      success_count: 0,
      fail_count: 0,
      product_ids: [] as string[],
      errors: [] as string[],
    };

    for (let i = 0; i < products.length; i++) {
      const productData = products[i];

      try {
        this.logger.log(
          `Processing product ${i + 1}/${products.length}: ${productData.title}`,
        );

        // Generate unique slug
        const baseSlug = slugify(productData.title);
        let slug = baseSlug;
        let j = 1;
        while (await this.prisma.product.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${j++}`;
        }

        // Upload image to Cloudinary
        let imageUrl: string;
        try {
          // Ensure image has proper data URI prefix for Cloudinary
          const imageData = productData.image_base64.startsWith('data:')
            ? productData.image_base64
            : `data:image/jpeg;base64,${productData.image_base64}`;

          this.logger.log(`Uploading image for product: ${productData.title}`);
          imageUrl = await this.cloudinaryService.uploadImage(imageData);
          this.logger.log(`✅ Image uploaded successfully: ${imageUrl}`);
        } catch (error) {
          throw new Error(`Image upload failed: ${error.message}`);
        }

        // Prepare metadata
        const metadata: any = {};
        if (productData.occasions && productData.occasions.length > 0) {
          metadata.occasions = productData.occasions;
        }
        if (productData.body_shapes && productData.body_shapes.length > 0) {
          metadata.body_shapes = productData.body_shapes;
        }
        if (productData.skin_tones && productData.skin_tones.length > 0) {
          metadata.skin_tones = productData.skin_tones;
        }
        if (productData.sizes && productData.sizes.length > 0) {
          metadata.sizes = productData.sizes;
        }

        // Create product
        const product = await this.prisma.product.create({
          data: {
            title: productData.title,
            slug,
            description: productData.description || '',
            price_cents: productData.price_cents,
            category: productData.category,
            currency: 'INR',
            creator_id: creatorId,
            status: 'DRAFT', // Products start as draft
            metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            images: {
              create: {
                url: imageUrl,
                is_primary: true,
                order_index: 0,
              },
            },
          },
        });

        results.success_count++;
        results.product_ids.push(product.product_id);
        this.logger.log(`✅ Created product: ${product.title}`);
      } catch (error) {
        results.fail_count++;
        const errorMessage = `Product ${i + 1} (${productData.title}): ${error.message}`;
        results.errors.push(errorMessage);
        this.logger.error(`❌ ${errorMessage}`);
      }
    }

    return {
      ...results,
      message: `Successfully uploaded ${results.success_count} out of ${products.length} products`,
    };
  }
}
