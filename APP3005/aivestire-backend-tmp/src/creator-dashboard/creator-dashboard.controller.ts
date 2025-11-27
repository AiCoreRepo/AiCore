import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CreatorDashboardService } from './creator-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('creator-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('creator')
export class CreatorDashboardController {
  constructor(
    private readonly creatorDashboardService: CreatorDashboardService,
  ) {}

  @Get('metrics')
  async getDashboardMetrics(@CurrentUser() user: { user_id: string }) {
    return await this.creatorDashboardService.getCreatorDashboardMetrics(
      user.user_id,
    );
  }

  @Get('products')
  async getProducts(@CurrentUser() user: { user_id: string }) {
    return await this.creatorDashboardService.getCreatorProducts(user.user_id);
  }

  @Post('products')
  async createProduct(
    @CurrentUser() user: { user_id: string },
    @Body() dto: CreateProductDto,
  ) {
    return await this.creatorDashboardService.createProduct(user.user_id, dto);
  }

  @Put('products/:id')
  async updateProduct(
    @CurrentUser() user: { user_id: string },
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return await this.creatorDashboardService.updateProduct(
      user.user_id,
      productId,
      dto,
    );
  }

  @Delete('products/:id')
  async deleteProduct(
    @CurrentUser() user: { user_id: string },
    @Param('id') productId: string,
  ) {
    return await this.creatorDashboardService.deleteProduct(
      user.user_id,
      productId,
    );
  }
}
