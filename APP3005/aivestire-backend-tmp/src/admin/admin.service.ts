import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewProductDto } from './dto/review-product.dto';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { UserRole, ProductStatus, ApprovalStatus } from '@prisma/client';
import { ADMIN_MESSAGES, CREATOR_STATUS } from './admin.constants';
import {
  calculateCreatorRevenue,
  OrderInput,
} from '../common/utils/revenue-calculation.utils';
import {
  GetCreatorsQueryDto,
  CreatorStatusFilter,
} from './dto/creator-management.dto';
import { UpdateAdminProductDto } from './dto/update-admin-product.dto';
import { parse } from 'csv-parse/sync';
import { DEFAULT_LOW_STOCK_THRESHOLD } from './inventory-management/inventory.constants';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) { }

  async getDashboardStats(): Promise<AdminStatsDto> {
    const [totalCreators, totalProducts, pendingApprovals] = await Promise.all([
      // Count users with CREATOR role
      this.prisma.user.count({
        where: { role: UserRole.CREATOR },
      }),

      // Count approved products
      this.prisma.product.count({
        where: {
          status: ProductStatus.APPROVED,
          is_deleted: false,
        },
      }),

      // Count pending approvals
      this.prisma.product.count({
        where: {
          status: ProductStatus.PENDING,
          is_deleted: false,
        },
      }),
    ]);

    // Revenue calculation - placeholder for now (will be implemented with orders)
    const totalRevenue = 0;

    return {
      totalCreators,
      totalProducts,
      pendingApprovals,
      totalRevenue,
    };
  }

  async getPendingProducts() {
    const pendingProducts = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PENDING,
        is_deleted: false,
      },
      include: {
        creator: {
          select: {
            creator_id: true,
            store_name: true,
            verified: true,
          },
        },
        images: {
          orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
          take: 1,
          select: {
            image_id: true,
            url: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Transform response for cleaner API
    return pendingProducts.map((product) => ({
      product_id: product.product_id,
      title: product.title,
      description: product.description,
      price_cents: product.price_cents,
      currency: product.currency,
      created_at: product.created_at,
      creator: {
        creator_id: product.creator.creator_id,
        store_name: product.creator.store_name,
        verified: product.creator.verified,
      },
      thumbnail: product.images[0]?.url || null,
    }));
  }

  /**
   * Get approved products (The Collection)
   * Supports pagination, search, and creator filtering
   */
  async getApprovedProducts(
    page: number = 1,
    limit: number = 20,
    search?: string,
    creatorId?: string,
  ) {
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: ProductStatus.APPROVED,
      is_deleted: false,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add creator filter
    if (creatorId) {
      where.creator_id = creatorId;
    }

    // Fetch products and total count in parallel
    const [products, total, featuredCount, lowStockCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          creator: {
            select: {
              creator_id: true,
              store_name: true,
              verified: true,
            },
          },
          images: {
            orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
            take: 1,
          },
          stats: {
            select: {
              views: true,
            },
          },
        },
        orderBy: { updated_at: 'desc' }, // Most recently approved first
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
      // Count featured products
      this.prisma.product.count({
        where: {
          status: ProductStatus.APPROVED,
          is_deleted: false,
          is_featured: true,
        },
      }),
      // Count low stock products (uses same threshold as InventoryManagementService)
      this.prisma.product.count({
        where: {
          status: ProductStatus.APPROVED,
          is_deleted: false,
          inventory_count: { gt: 0, lte: DEFAULT_LOW_STOCK_THRESHOLD },
        },
      }),
    ]);

    return {
      products: products.map((product) => ({
        product_id: product.product_id,
        title: product.title,
        description: product.description,
        price_cents: product.price_cents,
        currency: product.currency,
        thumbnail: product.images[0]?.url || null,
        created_at: product.created_at,
        approved_at: product.updated_at,
        inventory_count: product.inventory_count,
        category: product.category,
        is_featured: product.is_featured,
        views: product.stats?.views || 0,
        creator: {
          creator_id: product.creator.creator_id,
          store_name: product.creator.store_name,
          verified: product.creator.verified,
        },
      })),
      stats: {
        total,
        featured: featuredCount,
        lowStock: lowStockCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Get all products with pagination and filters
   */
  async getAllProductsAdmin(
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string,
    creatorId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      is_deleted: false,
    };

    if (status) {
      where.status = status;
    }

    if (creatorId) {
      where.creator_id = creatorId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          creator: {
            store_name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          creator: {
            select: {
              creator_id: true,
              store_name: true,
              verified: true,
            },
          },
          images: {
            orderBy: [{ is_primary: 'desc' }, { order_index: 'asc' }],
            take: 1,
          },
          stats: {
            select: {
              views: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((product: any) => ({
        product_id: product.product_id,
        title: product.title,
        description: product.description,
        price_cents: product.price_cents,
        commission_percentage: product.commission_percentage,
        currency: product.currency,
        thumbnail: product.images[0]?.url || null,
        created_at: product.created_at,
        status: product.status,
        inventory_count: product.inventory_count,
        category: product.category,
        is_featured: product.is_featured,
        views: product.stats?.views || 0,
        creator: {
          creator_id: product.creator.creator_id,
          store_name: product.creator.store_name,
          verified: product.creator.verified,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Admin edit product (price, commission)
   */
  async updateProductAdmin(productId: string, dto: UpdateAdminProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { product_id: productId },
    });

    if (!product) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.PRODUCT_NOT_FOUND);
    }

    // Only update allowed fields
    const dataToUpdate: any = {};
    if (dto.price_cents !== undefined) {
      dataToUpdate.price_cents = dto.price_cents;
    }
    if (dto.commission_percentage !== undefined) {
      dataToUpdate.commission_percentage = dto.commission_percentage;
    }
    
    if (Object.keys(dataToUpdate).length > 0) {
      dataToUpdate.updated_at = new Date();
      const updated = await this.prisma.product.update({
        where: { product_id: productId },
        data: dataToUpdate,
      });

      return {
        message: 'Product updated successfully',
        product_id: updated.product_id,
        price_cents: updated.price_cents,
        commission_percentage: updated.commission_percentage,
      };
    }

    return {
      message: 'No changes provided',
      product_id: product.product_id,
    };
  }

  /**
   * Toggle product featured status
   */
  async toggleProductFeature(productId: string, isFeatured: boolean) {
    const product = await this.prisma.product.findUnique({
      where: { product_id: productId },
    });

    if (!product) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.PRODUCT_NOT_FOUND);
    }

    const updated = await this.prisma.product.update({
      where: { product_id: productId },
      data: {
        is_featured: isFeatured,
        updated_at: new Date(),
      },
    });

    return {
      message: isFeatured
        ? 'Product featured successfully'
        : 'Product unfeatured successfully',
      product_id: updated.product_id,
      is_featured: updated.is_featured,
    };
  }

  /**
   * Update product inventory count
   */
  async updateProductStock(productId: string, inventoryCount: number) {
    const product = await this.prisma.product.findUnique({
      where: { product_id: productId },
    });

    if (!product) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.PRODUCT_NOT_FOUND);
    }

    const updated = await this.prisma.product.update({
      where: { product_id: productId },
      data: {
        inventory_count: inventoryCount,
        updated_at: new Date(),
      },
    });

    return {
      message: 'Stock updated successfully',
      product_id: updated.product_id,
      inventory_count: updated.inventory_count,
    };
  }

  /**
   * Delete product from collection (soft delete)
   * Sets is_deleted to true, keeping data for records
   */
  async deleteProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { product_id: productId },
    });

    if (!product) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.PRODUCT_NOT_FOUND);
    }

    const updated = await this.prisma.product.update({
      where: { product_id: productId },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });

    return {
      message: 'Product removed from collection successfully',
      product_id: updated.product_id,
    };
  }

  /**
   * Review a product (approve or reject)
   * Uses transaction to ensure atomicity
   */
  async reviewProduct(
    productId: string,
    dto: ReviewProductDto,
    adminUserId: string,
  ) {
    // Validate comment requirement for rejection
    if (dto.action === ApprovalStatus.REJECTED && !dto.comment) {
      throw new BadRequestException(
        ADMIN_MESSAGES.ERRORS.COMMENT_REQUIRED_FOR_REJECTION,
      );
    }

    // Use transaction to ensure all operations succeed or fail together
    return await this.prisma.$transaction(async (tx) => {
      // Step 1: Verify product exists
      const product = await tx.product.findUnique({
        where: { product_id: productId },
        include: {
          creator: {
            select: {
              store_name: true,
            },
          },
        },
      });

      if (!product) {
        throw new NotFoundException(ADMIN_MESSAGES.ERRORS.PRODUCT_NOT_FOUND);
      }

      // Step 2: Update product status
      const newStatus =
        dto.action === ApprovalStatus.APPROVED
          ? ProductStatus.APPROVED
          : ProductStatus.REJECTED;

      const updatedProduct = await tx.product.update({
        where: { product_id: productId },
        data: {
          status: newStatus,
          updated_at: new Date(),
        },
      });

      // Step 3: Create ProductApproval record
      const approval = await tx.productApproval.create({
        data: {
          product_id: productId,
          status: dto.action,
          comment: dto.comment || null,
          admin_user_id: adminUserId,
          actioned_at: new Date(),
        },
      });

      // Step 4: Create ApprovalLog entry for audit trail
      await tx.approvalLog.create({
        data: {
          approval_id: approval.approval_id,
          actor_user_id: adminUserId,
          action: dto.action,
          comment: dto.comment || null,
        },
      });

      // Return success response
      return {
        product_id: updatedProduct.product_id,
        title: updatedProduct.title,
        status: updatedProduct.status,
        creator_name: product.creator.store_name,
        approval: {
          approval_id: approval.approval_id,
          status: approval.status,
          comment: approval.comment,
          actioned_at: approval.actioned_at,
        },
        message:
          dto.action === ApprovalStatus.APPROVED
            ? ADMIN_MESSAGES.SUCCESS.PRODUCT_APPROVED
            : ADMIN_MESSAGES.SUCCESS.PRODUCT_REJECTED,
      };
    });
  }

  /**
   * Import products from CSV file
   */
  async importProductsFromCSV(file: Express.Multer.File) {
    this.logger.log('📤 CSV upload started');

    try {
      // Parse CSV
      const csvContent = file.buffer.toString('utf-8');
      const products = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
      });

      this.logger.log(`📦 Found ${products.length} products in CSV`);

      // Find or create creator user and profile
      let creatorUser = await this.prisma.user.findFirst({
        where: { email: 'collections@aivestire.com' },
      });

      if (!creatorUser) {
        creatorUser = await this.prisma.user.create({
          data: {
            email: 'collections@aivestire.com',
            password_hash: 'PLACEHOLDER',
            role: UserRole.CREATOR,
          },
        });
        this.logger.log(`✅ Created creator user account`);
      }

      // Ensure Creator profile exists
      let creatorProfile = await this.prisma.creator.findUnique({
        where: { user_id: creatorUser.user_id },
      });

      if (!creatorProfile) {
        creatorProfile = await this.prisma.creator.create({
          data: {
            user_id: creatorUser.user_id,
            store_name: 'AiVestire Collection',
            store_slug: 'aivestire-collection',
            verified: true,
          },
        });
        this.logger.log(`✅ Created creator profile`);
      }

      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;
      const errors: Array<{ row: number; product: string; error: string }> = [];

      // Import products
      for (let i = 0; i < products.length; i++) {
        const product: any = products[i];

        try {
          // Check if already exists
          const existing = await this.prisma.product.findFirst({
            where: {
              metadata: {
                path: ['cloth_id'],
                equals: product.Image,
              },
            },
          });

          if (existing) {
            skipCount++;
            continue;
          }

          // Generate product data
          const title =
            product.Description?.substring(0, 100) ||
            `${product.Style || ''} ${product['Clothing Type'] || 'Outfit'}`.trim();
          const slug = `${product['Clothing Type']?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'product'}-${Date.now()}-${i}`;
          const score = parseFloat(product.Score || '0.5');
          const priceCents = Math.round(2000 + score * 3000);

          // Create product
          await this.prisma.product.create({
            data: {
              title: title,
              slug: slug,
              description: product.Description || '',
              price_cents: priceCents,
              inventory_count: 10,
              category: product['Clothing Type'] || 'Clothing',
              status: ProductStatus.APPROVED,
              is_deleted: false,
              creator_id: creatorProfile.creator_id,
              metadata: {
                cloth_id: product.Image,
                occasion: product['@Occasion'],
                age_group: product['@Age Group'],
                body_shape: product['@Recommended Body shape'],
                recommended_size: product['@Recommended size'],
                skin_tone: product['@Skin tone'],
                clothing_type: product['Clothing Type'],
                fit: product.Fit,
                fabric: product.Fabric,
                color_family: product.Color_family,
                style: product.Style,
                quality_tag: product.Quality_Tag,
                score: product.Score,
              } as any,
              images: {
                create: [
                  {
                    url: product.image_url,
                    is_primary: true,
                    order_index: 0,
                  },
                ],
              },
            },
          });

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push({
            row: i + 1,
            product: product.Image,
            error: error.message,
          });
        }
      }

      this.logger.log(
        `✅ Import complete: ${successCount} success, ${skipCount} skipped, ${errorCount} errors`,
      );

      return {
        success: true,
        total: products.length,
        imported: successCount,
        skipped: skipCount,
        errors: errorCount,
        errorDetails: errors.slice(0, 10),
      };
    } catch (error: any) {
      this.logger.error('❌ CSV import failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATOR MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Get paginated list of creators with optional search and status filter.
   * Status is derived from User.status field ('active' | 'inactive').
   */
  async getCreators(query: GetCreatorsQueryDto) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const skip = (page - 1) * limit;

    // Build user-level where conditions
    const userWhere: any = { role: UserRole.CREATOR };

    if (query.status && query.status !== CreatorStatusFilter.ALL) {
      userWhere.status =
        query.status === CreatorStatusFilter.ACTIVE
          ? CREATOR_STATUS.ACTIVE
          : CREATOR_STATUS.INACTIVE;
    }

    if (query.search) {
      userWhere.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        {
          creatorProfile: {
            store_name: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [creators, total] = await Promise.all([
      this.prisma.creator.findMany({
        where: { user: userWhere },
        include: {
          user: {
            select: {
              user_id: true,
              email: true,
              status: true,
              created_at: true,
              last_login: true,
            },
          },
          _count: {
            select: {
              products: {
                where: { is_deleted: false },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.creator.count({ where: { user: userWhere } }),
    ]);

    return {
      creators: creators.map((c) => ({
        creator_id: c.creator_id,
        store_name: c.store_name,
        store_slug: c.store_slug,
        about: c.about,
        verified: c.verified,
        created_at: c.created_at,
        user: {
          user_id: c.user.user_id,
          email: c.user.email,
          status: c.user.status,
          last_login: c.user.last_login,
        },
        total_products: c._count.products,
        is_active: c.user.status === CREATOR_STATUS.ACTIVE,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Get a single creator by creator_id with full details and product summary
   */
  async getCreatorById(creatorId: string) {
    const creator = await this.prisma.creator.findUnique({
      where: { creator_id: creatorId },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            status: true,
            created_at: true,
            last_login: true,
            phone: true,
          },
        },
        limits: true,
        _count: {
          select: {
            products: { where: { is_deleted: false } },
          },
        },
      },
    });

    if (!creator) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.CREATOR_NOT_FOUND);
    }

    // Product summary breakdown
    const [approved, pending, rejected, rawOrderItems] = await Promise.all([
      this.prisma.product.count({
        where: { creator_id: creatorId, status: ProductStatus.APPROVED, is_deleted: false },
      }),
      this.prisma.product.count({
        where: { creator_id: creatorId, status: ProductStatus.PENDING, is_deleted: false },
      }),
      this.prisma.product.count({
        where: { creator_id: creatorId, status: ProductStatus.REJECTED, is_deleted: false },
      }),
      // Fetch only the raw data the utility needs — single optimized query
      this.prisma.orderItem.findMany({
        where: { product: { creator_id: creatorId } },
        select: {
          product_id: true,
          quantity: true,
          unit_price: true,
          order: {
            select: {
              order_id: true,
              payment_status: true,
              current_status: true,
            },
          },
        },
      }),
    ]);

    // Transform raw DB rows into the OrderInput format the utility understands
    const ordersForUtil: OrderInput[] = rawOrderItems.map((item) => ({
      orderId: item.order.order_id,
      paymentStatus: item.order.payment_status,
      currentStatus: item.order.current_status,
      items: [{
        productId: item.product_id,
        creatorId,
        unitPricePaise: Math.round(Number(item.unit_price) * 100),
        quantity: item.quantity,
      }],
    }));

    const revenueSummary = calculateCreatorRevenue(creatorId, ordersForUtil);

    return {
      creator_id: creator.creator_id,
      store_name: creator.store_name,
      store_slug: creator.store_slug,
      about: creator.about,
      verified: creator.verified,
      created_at: creator.created_at,
      user: {
        user_id: creator.user.user_id,
        email: creator.user.email,
        status: creator.user.status,
        last_login: creator.user.last_login,
        phone: creator.user.phone,
      },
      limits: creator.limits,
      is_active: creator.user.status === CREATOR_STATUS.ACTIVE,
      product_summary: {
        total: creator._count.products,
        approved,
        pending,
        rejected,
      },
      total_sales: revenueSummary.totalRevenuePaise,
      total_sales_formatted: revenueSummary.totalRevenueFormatted,
    };
  }

  /**
   * Get products uploaded by a specific creator with optional status filter
   */
  async getCreatorProducts(
    creatorId: string,
    statusFilter?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const creator = await this.prisma.creator.findUnique({
      where: { creator_id: creatorId },
    });

    if (!creator) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.CREATOR_NOT_FOUND);
    }

    const skip = (page - 1) * limit;

    const where: any = {
      creator_id: creatorId,
      is_deleted: false,
    };

    // Map filter string to enum
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'DRAFT', 'ARCHIVED'];
    if (statusFilter && validStatuses.includes(statusFilter)) {
      where.status = statusFilter as ProductStatus;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: {
            where: { is_primary: true },
            take: 1,
            select: { url: true },
          },
          stats: { select: { views: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const productIds = products.map((p) => p.product_id);

    // Fetch raw order items for this product set
    const rawOrderItems = await this.prisma.orderItem.findMany({
      where: { product_id: { in: productIds } },
      select: {
        product_id: true,
        quantity: true,
        unit_price: true,
        order: {
          select: {
            order_id: true,
            payment_status: true,
            current_status: true,
          },
        },
      },
    });

    // Build OrderInput array for the utility
    const ordersForUtil: OrderInput[] = rawOrderItems.map((item) => ({
      orderId: item.order.order_id,
      paymentStatus: item.order.payment_status,
      currentStatus: item.order.current_status,
      items: [{
        productId: item.product_id,
        creatorId,
        unitPricePaise: Math.round(Number(item.unit_price) * 100),
        quantity: item.quantity,
      }],
    }));

    // Use the utility to compute all product-level sales
    const revenueSummary = calculateCreatorRevenue(creatorId, ordersForUtil);
    const salesMap = new Map(
      revenueSummary.productWiseSales.map((s) => [s.productId, s]),
    );

    return {
      products: products.map((p) => ({
        product_id: p.product_id,
        title: p.title,
        description: p.description,
        status: p.status,
        price_cents: p.price_cents,
        currency: p.currency,
        category: p.category,
        created_at: p.created_at,
        thumbnail: p.images[0]?.url || null,
        views: p.stats?.views || 0,
        inventory_count: p.inventory_count,
        is_featured: p.is_featured,
        sales: {
          units_sold: salesMap.get(p.product_id)?.unitsSold || 0,
          revenue_generated: salesMap.get(p.product_id)?.revenuePaise || 0,
          revenue_formatted: salesMap.get(p.product_id)?.revenueFormatted || '₹0.00',
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Activate or deactivate a creator.
   * Sets User.status = 'active' | 'inactive'.
   * When deactivated, products are NOT deleted but are hidden from storefront
   * (consumer-facing queries should filter by creator's user status).
   */
  async toggleCreatorStatus(creatorId: string, action: 'ACTIVE' | 'INACTIVE') {
    const creator = await this.prisma.creator.findUnique({
      where: { creator_id: creatorId },
      include: { user: { select: { user_id: true, status: true } } },
    });

    if (!creator) {
      throw new NotFoundException(ADMIN_MESSAGES.ERRORS.CREATOR_NOT_FOUND);
    }

    const newStatus =
      action === 'ACTIVE' ? CREATOR_STATUS.ACTIVE : CREATOR_STATUS.INACTIVE;

    await this.prisma.user.update({
      where: { user_id: creator.user.user_id },
      data: { status: newStatus },
    });

    return {
      creator_id: creator.creator_id,
      store_name: creator.store_name,
      is_active: newStatus === CREATOR_STATUS.ACTIVE,
      message:
        action === 'ACTIVE'
          ? ADMIN_MESSAGES.SUCCESS.CREATOR_ACTIVATED
          : ADMIN_MESSAGES.SUCCESS.CREATOR_DEACTIVATED,
    };
  }
}
