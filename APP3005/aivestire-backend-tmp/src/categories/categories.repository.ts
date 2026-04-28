import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Category, SubCategory } from '@prisma/client';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // CATEGORIES
  // ==========================================

  async findCategoryBySlug(slug: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { slug }
    });
  }

  async findCategoryById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { category_id: id }
    });
  }

  async findCategoryBySlugExceptId(slug: string, excludeId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: { slug, category_id: { not: excludeId } }
    });
  }

  async createCategory(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data });
  }

  async getActiveCategoriesWithSubcategories() {
    return this.prisma.category.findMany({
      where: { is_active: true },
      include: {
        subcategories: {
          where: { is_active: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getAllCategoriesAdmin() {
    return this.prisma.category.findMany({
      include: {
        subcategories: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async updateCategory(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({
      where: { category_id: id },
      data
    });
  }

  async deleteCategory(id: string): Promise<Category> {
    return this.prisma.category.delete({
      where: { category_id: id }
    });
  }

  // ==========================================
  // SUBCATEGORIES
  // ==========================================

  async findSubCategoryBySlug(slug: string): Promise<SubCategory | null> {
    return this.prisma.subCategory.findUnique({
      where: { slug }
    });
  }

  async findSubCategoryByIdWithCategory(id: string) {
    return this.prisma.subCategory.findUnique({
      where: { sub_category_id: id },
      include: { category: true }
    });
  }

  async findSubCategoryBySlugExceptId(slug: string, excludeId: string): Promise<SubCategory | null> {
    return this.prisma.subCategory.findFirst({
      where: { slug, sub_category_id: { not: excludeId } }
    });
  }

  async createSubCategory(data: Prisma.SubCategoryCreateInput): Promise<SubCategory> {
    return this.prisma.subCategory.create({ data });
  }

  async updateSubCategory(id: string, data: Prisma.SubCategoryUpdateInput): Promise<SubCategory> {
    return this.prisma.subCategory.update({
      where: { sub_category_id: id },
      data
    });
  }

  async deleteSubCategory(id: string): Promise<SubCategory> {
    return this.prisma.subCategory.delete({
      where: { sub_category_id: id }
    });
  }
}
