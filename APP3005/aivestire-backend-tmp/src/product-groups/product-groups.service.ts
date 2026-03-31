import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProductGroupsRepository } from './product-groups.repository';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';
import { AssignProductsDto } from './dto/assign-products.dto';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/utils/string.utils';
import { CreatorsService } from '../creators/creators.service';

@Injectable()
export class ProductGroupsService {
  constructor(
    private readonly repository: ProductGroupsRepository,
    private readonly prisma: PrismaService,
    private readonly creatorsService: CreatorsService,
  ) {}

  private async getCreatorId(userId: string): Promise<string> {
    const creator = await this.creatorsService.getCreatorByUserId(userId);
    return creator.creator_id;
  }

  async create(userId: string, dto: CreateProductGroupDto) {
    const creatorId = await this.getCreatorId(userId);
    const baseSlug = slugify(dto.name);
    let slug = baseSlug;
    let i = 1;
    while (await this.repository.checkSlugExists(creatorId, slug)) {
      slug = `${baseSlug}-${i++}`;
    }

    if (dto.parent_id) {
      const parent = await this.repository.findById(dto.parent_id);
      if (!parent || parent.creator_id !== creatorId) {
        throw new BadRequestException('Invalid parent_id provided');
      }
    }

    return this.repository.create({
      creator_id: creatorId,
      name: dto.name,
      slug,
      description: dto.description,
      parent_id: dto.parent_id,
    });
  }

  async findAllByCreator(userId: string) {
    const creatorId = await this.getCreatorId(userId);
    const groups = await this.repository.findByCreatorId(creatorId);
    
    // Build tree structure natively
    const groupMap = new Map();
    const result: any[] = [];

    groups.forEach((group) => {
      groupMap.set(group.group_id, { ...group, children_groups: [] });
    });

    groups.forEach((group) => {
      if (group.parent_id && groupMap.has(group.parent_id)) {
        groupMap.get(group.parent_id).children_groups.push(groupMap.get(group.group_id));
      } else {
        result.push(groupMap.get(group.group_id));
      }
    });

    return result;
  }

  async findOne(id: string, userId: string) {
    const creatorId = await this.getCreatorId(userId);
    const group = await this.repository.findByIdAndCreator(id, creatorId);
    if (!group) throw new NotFoundException('Product group not found');
    return group;
  }

  async update(id: string, userId: string, dto: UpdateProductGroupDto) {
    const creatorId = await this.getCreatorId(userId);
    const group = await this.repository.findById(id);
    if (!group || group.creator_id !== creatorId) {
      throw new NotFoundException('Product group not found');
    }

    let slug = group.slug;
    if (dto.name && dto.name !== group.name) {
      const baseSlug = slugify(dto.name);
      slug = baseSlug;
      let i = 1;
      while (await this.repository.checkSlugExists(creatorId, slug)) {
        slug = `${baseSlug}-${i++}`;
      }
    }

    if (dto.parent_id !== undefined) {
      if (dto.parent_id === id) {
        throw new BadRequestException('A group cannot be its own parent');
      }

      if (dto.parent_id) {
        const parent = await this.repository.findById(dto.parent_id);
        if (!parent || parent.creator_id !== creatorId) {
          throw new BadRequestException('Invalid parent_id provided');
        }

        // Cycle detection limit 5 levels
        let currentParentId = parent.parent_id;
        let depth = 1;
        while (currentParentId) {
          if (currentParentId === id) {
            throw new BadRequestException('Circular parent-child relationship detected');
          }
          if (depth >= 5) {
             throw new BadRequestException('Maximum hierarchy depth of 5 exceeded');
          }
          const ancestor = await this.repository.findById(currentParentId);
          currentParentId = ancestor?.parent_id || null;
          depth++;
        }
      }
    }

    return this.repository.update(id, {
      name: dto.name,
      slug,
      description: dto.description,
      ...(dto.parent_id !== undefined ? {
        parent: dto.parent_id ? { connect: { group_id: dto.parent_id } } : { disconnect: true }
      } : {}),
    });
  }

  async remove(id: string, userId: string) {
    const creatorId = await this.getCreatorId(userId);
    const group = await this.repository.findById(id);
    if (!group || group.creator_id !== creatorId) {
      throw new NotFoundException('Product group not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Find all children and promote them to the parent of the deleted group
      const children = await tx.productGroup.findMany({ where: { parent_id: id } });
      
      for (const child of children) {
        await tx.productGroup.update({
          where: { group_id: child.group_id },
          data: { parent_id: group.parent_id }, // Can be null if group was root
        });
      }

      // Group itself is deleted, products remain but drop the relationship via Cascade
      await tx.productGroup.delete({ where: { group_id: id } });

      return { message: 'Product group deleted successfully' };
    });
  }

  async assignProducts(id: string, userId: string, dto: AssignProductsDto) {
    const creatorId = await this.getCreatorId(userId);
    const group = await this.repository.findById(id);
    if (!group || group.creator_id !== creatorId) {
      throw new NotFoundException('Product group not found');
    }

    let assignedCount = 0;
    for (const productId of dto.product_ids) {
      // Validate product ownership
      const product = await this.prisma.product.findFirst({
        where: { product_id: productId, creator_id: creatorId },
      });

      if (product) {
        // Prevent duplicate assignments gracefully
        const existing = await this.prisma.productGroupAssignment.findUnique({
          where: { product_id_group_id: { product_id: productId, group_id: id } }
        });

        if (!existing) {
          await this.repository.assignProduct(id, productId);
          assignedCount++;
        }
      }
    }

    return { message: `Assigned ${assignedCount} products to the group` };
  }

  async unassignProduct(id: string, productId: string, userId: string) {
    const creatorId = await this.getCreatorId(userId);
    const group = await this.repository.findById(id);
    if (!group || group.creator_id !== creatorId) {
      throw new NotFoundException('Product group not found');
    }

    await this.repository.removeProduct(id, productId);
    return { message: 'Product removed from group' };
  }
}
