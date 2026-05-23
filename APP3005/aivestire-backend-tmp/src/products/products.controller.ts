import {
  BadRequestException,
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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { ProductsService } from './products.service';
import { BulkUploadService } from './bulk-upload.service';
import { CreatorUploadService } from './creator-upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateProductHierarchyDto, CreatePatternDto, CreateColorVariantDto } from './dto/create-product-hierarchy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

const ALLOWED_CREATOR_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);
const MAX_CREATOR_UPLOAD_FILE_SIZE = 20 * 1024 * 1024;
const MAX_CREATOR_UPLOAD_FILES = 40;
const MAX_CREATOR_UPLOAD_TOTAL_SIZE = 200 * 1024 * 1024;

function hasAllowedCreatorImageSignature(file: Express.Multer.File): boolean {
  const buffer = file.buffer;
  if (!buffer || buffer.length < 12) return false;

  const isJpeg =
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  const isWebp =
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP';

  return isJpeg || isPng || isWebp;
}

function flattenValidationErrors(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => {
    const current = error.constraints ? Object.values(error.constraints) : [];
    const children = error.children?.length
      ? flattenValidationErrors(error.children)
      : [];

    return [...current, ...children];
  });
}

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly bulkUploadService: BulkUploadService,
    private readonly creatorUploadService: CreatorUploadService,
  ) {}

  private parseHierarchyPayload(payload: string): CreateProductHierarchyDto {
    if (!payload) {
      throw new BadRequestException('Missing product hierarchy payload');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new BadRequestException('Invalid product hierarchy payload');
    }

    const dto = plainToInstance(CreateProductHierarchyDto, parsed);
    const validationErrors = validateSync(dto, {
      whitelist: true,
      forbidUnknownValues: false,
    });

    if (validationErrors.length > 0) {
      const messages = flattenValidationErrors(validationErrors);
      throw new BadRequestException(
        messages.length > 0
          ? messages
          : 'Invalid product hierarchy payload',
      );
    }

    return dto;
  }

  // ============================================================
  // CREATOR UPLOAD HIERARCHY ENDPOINTS
  // Product → Pattern → Color Variant
  // ============================================================

  /**
   * POST /products/hierarchy
   * Create a full product with nested patterns and color variants.
   * This is the primary upload endpoint for the new guided creator flow.
   */
  @Post('hierarchy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  async createProductHierarchy(
    @Request() req,
    @Body() dto: CreateProductHierarchyDto,
  ) {
    return this.creatorUploadService.createProductHierarchy(dto, req.user.user_id);
  }

  /**
   * POST /products/hierarchy/files
   * Faster creator upload path. Sends original image files as multipart bytes
   * instead of base64 JSON, avoiding payload bloat and preserving input quality.
   */
  @Post('hierarchy/files')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: {
        files: MAX_CREATOR_UPLOAD_FILES,
        fileSize: MAX_CREATOR_UPLOAD_FILE_SIZE,
      },
    }),
  )
  async createProductHierarchyWithFiles(
    @Request() req,
    @Body('payload') payload: string,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    const dto = this.parseHierarchyPayload(payload);
    const filesByKey = new Map<string, Express.Multer.File>();
    let totalUploadBytes = 0;

    for (const file of files) {
      if (filesByKey.has(file.fieldname)) {
        throw new BadRequestException('Duplicate product image upload field');
      }

      if (!ALLOWED_CREATOR_IMAGE_TYPES.has(file.mimetype)) {
        throw new BadRequestException(
          'Only JPEG, PNG, and WebP product images are allowed',
        );
      }

      if (file.size > MAX_CREATOR_UPLOAD_FILE_SIZE) {
        throw new BadRequestException(
          'Each product image must be 20MB or smaller',
        );
      }

      if (!hasAllowedCreatorImageSignature(file)) {
        throw new BadRequestException(
          'Uploaded product image content must be a valid JPEG, PNG, or WebP file',
        );
      }

      totalUploadBytes += file.size;
      if (totalUploadBytes > MAX_CREATOR_UPLOAD_TOTAL_SIZE) {
        throw new BadRequestException(
          'Total product image upload size must be 200MB or smaller',
        );
      }

      filesByKey.set(file.fieldname, file);
    }

    return this.creatorUploadService.createProductHierarchy(
      dto,
      req.user.user_id,
      filesByKey,
    );
  }

  /**
   * GET /products/:id/hierarchy
   * Get the full Product → Pattern → Color Variant tree for a product.
   */
  @Get(':id/hierarchy')
  async getProductHierarchy(@Param('id') id: string) {
    return this.creatorUploadService.getProductHierarchy(id);
  }

  /**
   * POST /products/:id/patterns
   * Add a new pattern to an existing product.
   */
  @Post(':id/patterns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  async addPattern(
    @Param('id') productId: string,
    @Request() req,
    @Body() dto: CreatePatternDto,
  ) {
    return this.creatorUploadService.addPattern(productId, req.user.user_id, dto);
  }

  /**
   * DELETE /products/patterns/:patternId
   * Remove a pattern (and its color variants) from a product.
   */
  @Delete('patterns/:patternId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  async removePattern(
    @Param('patternId') patternId: string,
    @Request() req,
  ) {
    return this.creatorUploadService.removePattern(patternId, req.user.user_id);
  }

  /**
   * POST /products/patterns/:patternId/variants
   * Add a new color variant to an existing pattern.
   */
  @Post('patterns/:patternId/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  async addColorVariant(
    @Param('patternId') patternId: string,
    @Request() req,
    @Body() dto: CreateColorVariantDto,
  ) {
    return this.creatorUploadService.addColorVariant(patternId, req.user.user_id, dto);
  }

  /**
   * DELETE /products/variants/:variantId
   * Remove a color variant from a pattern.
   */
  @Delete('variants/:variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  async removeColorVariant(
    @Param('variantId') variantId: string,
    @Request() req,
  ) {
    return this.creatorUploadService.removeColorVariant(variantId, req.user.user_id);
  }

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
    @Query('bodyShapes') bodyShapes?: string,
    @Query('skinTones') skinTones?: string,
    @Query('availability') availability?: string,
    @Query('groupId') groupId?: string,
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
      bodyShapes,
      skinTones,
      availability,
      groupId,
    );
  }

  /**
   * POST /products/like
   * Like or unlike a product
   * Requires authentication
   */
  @Post('like')
  @UseGuards(JwtAuthGuard)
  async likeProduct(@Request() req, @Body() body: { product_id: string }) {
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
  async addComment(@Request() req, @Body() createCommentDto: CreateCommentDto) {
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
  async deleteComment(@Param('commentId') commentId: string, @Request() req) {
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
  async bulkUpload(@Request() req, @Body() body: { products: any[] }) {
    const userId = req.user.user_id;
    return this.bulkUploadService.bulkCreateProducts(body.products, userId);
  }

  /**
   * GET /products/:id/likes
   * Get product likes count and user's like status
   */
  @Get(':id/likes')
  async getProductLikes(@Param('id') productId: string, @Request() req) {
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
