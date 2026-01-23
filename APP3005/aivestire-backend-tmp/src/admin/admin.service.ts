import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewProductDto } from './dto/review-product.dto';
import { AdminStatsDto } from './dto/admin-stats.dto';
import {
    UserRole,
    ProductStatus,
    ApprovalStatus,
} from '@prisma/client';
import { ADMIN_MESSAGES } from './admin.constants';
import { parse } from 'csv-parse/sync';

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
                    orderBy: [
                        { is_primary: 'desc' },
                        { order_index: 'asc' },
                    ],
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
                        orderBy: [
                            { is_primary: 'desc' },
                            { order_index: 'asc' },
                        ],
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
            // Count low stock products
            this.prisma.product.count({
                where: {
                    status: ProductStatus.APPROVED,
                    is_deleted: false,
                    inventory_count: { lt: 5 },
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
                    const title = product.Description?.substring(0, 100) ||
                        `${product.Style || ''} ${product['Clothing Type'] || 'Outfit'}`.trim();
                    const slug = `${product['Clothing Type']?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'product'}-${Date.now()}-${i}`;
                    const score = parseFloat(product.Score || '0.5');
                    const priceCents = Math.round(2000 + (score * 3000));

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

            this.logger.log(`✅ Import complete: ${successCount} success, ${skipCount} skipped, ${errorCount} errors`);

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
}
