import {
    Injectable,
    NotFoundException,
    BadRequestException,
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

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get dashboard statistics for admin
     * Uses Promise.all for parallel queries to optimize performance
     */
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

    /**
     * Get all products pending approval
     * Includes creator info and primary image for display
     */
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
                created_at: 'asc', // Oldest first (FIFO)
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
}
