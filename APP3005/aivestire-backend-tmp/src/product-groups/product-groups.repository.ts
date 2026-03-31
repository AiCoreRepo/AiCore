import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductGroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ProductGroupUncheckedCreateInput) {
    return this.prisma.productGroup.create({
      data,
    });
  }

  async findByCreatorId(creatorId: string) {
    return this.prisma.productGroup.findMany({
      where: { creator_id: creatorId },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(groupId: string) {
    return this.prisma.productGroup.findUnique({
      where: { group_id: groupId },
      include: {
        children: true,
        parent: true,
      },
    });
  }

  async findByIdAndCreator(groupId: string, creatorId: string) {
    return this.prisma.productGroup.findFirst({
      where: { group_id: groupId, creator_id: creatorId },
      include: {
        products: {
          include: {
            product: {
              select: {
                product_id: true,
                title: true,
                price_cents: true,
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  async update(groupId: string, data: Prisma.ProductGroupUpdateInput) {
    return this.prisma.productGroup.update({
      where: { group_id: groupId },
      data,
    });
  }

  async delete(groupId: string) {
    return this.prisma.productGroup.delete({
      where: { group_id: groupId },
    });
  }

  async findChildren(groupId: string) {
    return this.prisma.productGroup.findMany({
      where: { parent_id: groupId },
    });
  }

  async assignProduct(groupId: string, productId: string) {
    return this.prisma.productGroupAssignment.create({
      data: {
        group_id: groupId,
        product_id: productId,
      },
    });
  }

  async removeProduct(groupId: string, productId: string) {
    return this.prisma.productGroupAssignment.deleteMany({
      where: {
        group_id: groupId,
        product_id: productId,
      },
    });
  }

  async checkSlugExists(creatorId: string, slug: string) {
    const group = await this.prisma.productGroup.findUnique({
      where: {
        creator_id_slug: { creator_id: creatorId, slug },
      },
    });
    return !!group;
  }
}
