import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { AdminJwtGuard } from '../auth/admin/guards/admin-jwt.guard';

@Controller()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  // Public Categories API (Used by Creator dashboard and potentially shopping app)
  @Get('categories')
  async getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  // Admin Categories API
  @Get('admin/categories')
  @UseGuards(AdminJwtGuard)
  async getAdminCategories() {
    return this.categoriesService.getAdminCategories();
  }

  @Post('admin/categories')
  @UseGuards(AdminJwtGuard)
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }


  @Put('admin/categories/:id')
  @UseGuards(AdminJwtGuard)
  async updateCategory(@Param('id') id: string, @Body() dto: Partial<CreateCategoryDto>) {
    return this.categoriesService.updateCategory(id, dto);
  }

  @Delete('admin/categories/:id')
  @UseGuards(AdminJwtGuard)
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }

  @Post('admin/categories/:id/subcategories')
  @UseGuards(AdminJwtGuard)
  async createSubCategory(@Param('id') id: string, @Body() dto: CreateSubCategoryDto) {
    return this.categoriesService.createSubCategory(id, dto);
  }

  @Put('admin/subcategories/:id')
  @UseGuards(AdminJwtGuard)
  async updateSubCategory(@Param('id') id: string, @Body() dto: Partial<CreateSubCategoryDto>) {
    return this.categoriesService.updateSubCategory(id, dto);
  }

  @Delete('admin/subcategories/:id')
  @UseGuards(AdminJwtGuard)
  async deleteSubCategory(@Param('id') id: string) {
    return this.categoriesService.deleteSubCategory(id);
  }
}
