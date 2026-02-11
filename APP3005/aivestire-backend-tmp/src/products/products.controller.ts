import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Get,
  Query,
  Request,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { BulkUploadService } from './bulk-upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';


@Controller('api/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly bulkUploadService: BulkUploadService,
  ) { }

  /**
   * GET /products/approved
   * Public endpoint - No authentication required
   * Returns approved products for the collection page
   * Non-logged-in users can browse products
   */
  @Get('approved')
  getApprovedProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sizes') sizes?: string,
    @Query('colors') colors?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const minP = minPrice ? parseInt(minPrice, 10) : undefined;
    const maxP = maxPrice ? parseInt(maxPrice, 10) : undefined;

    return this.productsService.getApprovedProducts(
      pageNum,
      limitNum,
      search,
      category,
      minP,
      maxP,
      sortBy,
      sizes,
      colors,
    );
  }

  /**
   * POST /products/like
   * Like or unlike a product
   * Requires authentication
   */
  @Post('like')
  @UseGuards(JwtAuthGuard)
  async likeProduct(
    @Request() req,
    @Body() body: { product_id: string },
  ) {
    console.log('Like endpoint - req.user:', req.user);
    console.log('Like endpoint - user_id:', req.user.user_id);
    return this.productsService.likeProduct(req.user.user_id, body.product_id);
  }

  /**
   * POST /products/comment
   * Add a comment to a product
   * Requires authentication
   */
  @Post('comment')
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Request() req,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.productsService.addComment(
      req.user.user_id,
      createCommentDto.product_id,
      createCommentDto.comment_text,
      createCommentDto.images,
    );
  }

  /**
   * DELETE /products/comment/:commentId
   * Delete a comment (only by comment owner or product creator)
   * Requires authentication
   */
  @Delete('comment/:commentId')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('commentId') commentId: string,
    @Request() req,
  ) {
    return this.productsService.deleteComment(commentId, req.user.user_id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  /**
   * POST /products/bulk-upload
   * Bulk upload products (up to 10 at once)
   * Requires CREATOR role
   */
  @Post('bulk-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  async bulkUpload(
    @Request() req,
    @Body() body: { products: any[] },
  ) {
    const creatorId = req.user.user_id;
    return this.bulkUploadService.bulkCreateProducts(body.products, creatorId);
  }

  /**
   * GET /products/:id/likes
   * Get product likes count and user's like status
   */
  @Get(':id/likes')
  async getProductLikes(
    @Param('id') productId: string,
    @Request() req,
  ) {
    const userId = req.user?.user_id;
    return this.productsService.getProductLikes(productId, userId);
  }

  /**
   * GET /products/:id
   * Get single product details
   * Public endpoint
   */
  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * GET /products/:id/comments
   * Get all comments for a product
   */
  @Get(':id/comments')
  async getProductComments(@Param('id') productId: string) {
    return this.productsService.getProductComments(productId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Post(':id/submit')
  submitForApproval(@Param('id') id: string) {
    return this.productsService.submitForApproval(id);
  }
}
