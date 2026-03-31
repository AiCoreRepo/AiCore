import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProductGroupsService } from './product-groups.service';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';
import { AssignProductsDto } from './dto/assign-products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('product-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CREATOR')
export class ProductGroupsController {
  constructor(private readonly productGroupsService: ProductGroupsService) {}

  @Post()
  create(@Request() req, @Body() createProductGroupDto: CreateProductGroupDto) {
    return this.productGroupsService.create(req.user.user_id, createProductGroupDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.productGroupsService.findAllByCreator(req.user.user_id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.productGroupsService.findOne(id, req.user.user_id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateProductGroupDto: UpdateProductGroupDto) {
    return this.productGroupsService.update(id, req.user.user_id, updateProductGroupDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.productGroupsService.remove(id, req.user.user_id);
  }

  @Post(':id/products')
  assignProducts(@Request() req, @Param('id') id: string, @Body() assignProductsDto: AssignProductsDto) {
    return this.productGroupsService.assignProducts(id, req.user.user_id, assignProductsDto);
  }

  @Delete(':id/products/:productId')
  unassignProduct(@Request() req, @Param('id') id: string, @Param('productId') productId: string) {
    return this.productGroupsService.unassignProduct(id, productId, req.user.user_id);
  }
}
