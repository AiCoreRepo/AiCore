import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  // ==========================================
  // CATEGORIES
  // ==========================================

  async createCategory(dto: CreateCategoryDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    const existing = await this.categoriesRepository.findCategoryBySlug(slug);

    if (existing) {
      throw new ConflictException(`Category with name "${dto.name}" or slug "${slug}" already exists`);
    }

    return await this.categoriesRepository.createCategory({
      name: dto.name,
      slug,
      description: dto.description,
      is_active: dto.is_active ?? true,
    });
  }

  async getAllCategories() {
    return await this.categoriesRepository.getActiveCategoriesWithSubcategories();
  }

  async getAdminCategories() {
    return await this.categoriesRepository.getAllCategoriesAdmin();
  }

  async updateCategory(id: string, dto: Partial<CreateCategoryDto>) {
    const category = await this.categoriesRepository.findCategoryById(id);
    if (!category) throw new NotFoundException('Category not found');

    let slug = category.slug;
    if (dto.name || dto.slug) {
      slug = dto.slug || (dto.name ? dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : category.slug);
      
      const existing = await this.categoriesRepository.findCategoryBySlugExceptId(slug, id);
      if (existing) throw new ConflictException(`Category slug "${slug}" is already in use`);
    }

    return await this.categoriesRepository.updateCategory(id, {
      ...dto,
      slug
    });
  }

  async deleteCategory(id: string) {
    return await this.categoriesRepository.deleteCategory(id);
  }

  // ==========================================
  // SUBCATEGORIES
  // ==========================================

  async createSubCategory(categoryId: string, dto: CreateSubCategoryDto) {
    const category = await this.categoriesRepository.findCategoryById(categoryId);
    if (!category) throw new NotFoundException('Parent category not found');

    const slug = dto.slug || `${category.slug}-${dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}`;
    
    const existing = await this.categoriesRepository.findSubCategoryBySlug(slug);

    if (existing) {
      throw new ConflictException(`Subcategory with slug "${slug}" already exists`);
    }

    return await this.categoriesRepository.createSubCategory({
      category: { connect: { category_id: categoryId } },
      name: dto.name,
      slug,
      description: dto.description,
      is_active: dto.is_active ?? true,
    });
  }

  async updateSubCategory(id: string, dto: Partial<CreateSubCategoryDto>) {
    const subCategory = await this.categoriesRepository.findSubCategoryByIdWithCategory(id);
    
    if (!subCategory) throw new NotFoundException('SubCategory not found');

    let slug = subCategory.slug;
    if (dto.name || dto.slug) {
      slug = dto.slug || (dto.name ? `${subCategory.category.slug}-${dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}` : subCategory.slug);
      
      const existing = await this.categoriesRepository.findSubCategoryBySlugExceptId(slug, id);
      if (existing) throw new ConflictException(`Subcategory slug "${slug}" is already in use`);
    }

    return await this.categoriesRepository.updateSubCategory(id, {
      ...dto,
      slug
    });
  }

  async deleteSubCategory(id: string) {
    return await this.categoriesRepository.deleteSubCategory(id);
  }
}
