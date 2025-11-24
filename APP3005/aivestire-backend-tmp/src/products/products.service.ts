import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';
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
  ) {}

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
      if (product.status !== 'draft')
        throw new BadRequestException('Only draft products can be submitted');

      await tx.product.update({
        where: { product_id: id },
        data: { status: 'pending_review' },
      });

      await tx.productApproval.create({
        data: {
          product_id: id,
          status: 'pending',
        },
      });

      return { message: 'Product submitted for approval' };
    });
  }
}
