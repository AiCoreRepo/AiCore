import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import {
    WishlistResponseDto,
    WishlistSummaryDto,
    WishlistCheckResponseDto,
} from './dto/wishlist-response.dto';
import {
    WISHLIST_CONSTANTS,
    WISHLIST_MESSAGES,
    WISHLIST_QUERY_SELECT,
} from './wishlist.constants';
import { CartService } from '../cart/cart.service';

@Injectable()
export class WishlistService {
    constructor(
        private prisma: PrismaService,
        private cartService: CartService,
    ) { }

    /**
     * Get or create wishlist for user
     */
    async getOrCreateWishlist(userId: string) {
        let wishlist = await this.prisma.wishlist.findUnique({
            where: { user_id: userId },
        });

        if (!wishlist) {
            wishlist = await this.prisma.wishlist.create({
                data: { user_id: userId },
            });
        }

        return wishlist;
    }

    /**
     * Get user's wishlist with all items and product details
     */
    async getWishlist(userId: string): Promise<WishlistResponseDto> {
        const wishlist = await this.getOrCreateWishlist(userId);

        const wishlistWithItems = await this.prisma.wishlist.findUnique({
            where: { wishlist_id: wishlist.wishlist_id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                ...WISHLIST_QUERY_SELECT.PRODUCT,
                                creator: {
                                    select: WISHLIST_QUERY_SELECT.CREATOR,
                                },
                                images: {
                                    select: WISHLIST_QUERY_SELECT.IMAGE,
                                    orderBy: [
                                        { is_primary: 'desc' },
                                        { order_index: 'asc' },
                                    ],
                                    take: 3,
                                },
                            },
                        },
                    },
                    orderBy: { added_at: 'desc' },
                },
            },
        });

        // Filter out deleted/unavailable products and map response
        const validItems = wishlistWithItems!.items.filter(
            (item) =>
                !item.product.is_deleted &&
                item.product.status === WISHLIST_CONSTANTS.APPROVED_STATUS,
        );

        const summary = this.calculateSummary(validItems);

        return {
            wishlist_id: wishlistWithItems!.wishlist_id,
            user_id: wishlistWithItems!.user_id,
            created_at: wishlistWithItems!.created_at,
            updated_at: wishlistWithItems!.updated_at,
            items: validItems.map((item) => ({
                wishlist_item_id: item.wishlist_item_id,
                product_id: item.product_id,
                added_at: item.added_at,
                product: {
                    product_id: item.product.product_id,
                    title: item.product.title,
                    slug: item.product.slug,
                    price_cents: item.product.price_cents,
                    currency: item.product.currency,
                    inventory_count: item.product.inventory_count,
                    category: item.product.category,
                    creator: item.product.creator,
                    images: item.product.images,
                },
            })),
            summary,
        };
    }

    /**
     * Add item to wishlist
     */
    async addToWishlist(
        userId: string,
        dto: AddToWishlistDto,
    ): Promise<WishlistResponseDto> {
        const wishlist = await this.getOrCreateWishlist(userId);

        // Check wishlist limit
        const currentCount = await this.prisma.wishlistItem.count({
            where: { wishlist_id: wishlist.wishlist_id },
        });

        if (currentCount >= WISHLIST_CONSTANTS.MAX_ITEMS) {
            throw new BadRequestException(WISHLIST_MESSAGES.MAX_ITEMS_EXCEEDED);
        }

        // Verify product exists and is available
        const product = await this.prisma.product.findUnique({
            where: { product_id: dto.product_id },
            select: {
                product_id: true,
                status: true,
                is_deleted: true,
            },
        });

        if (!product) {
            throw new NotFoundException(WISHLIST_MESSAGES.PRODUCT_NOT_FOUND);
        }

        if (product.is_deleted) {
            throw new BadRequestException(WISHLIST_MESSAGES.PRODUCT_UNAVAILABLE);
        }

        if (product.status !== WISHLIST_CONSTANTS.APPROVED_STATUS) {
            throw new BadRequestException(WISHLIST_MESSAGES.PRODUCT_NOT_APPROVED);
        }

        // Check if already in wishlist
        const existingItem = await this.prisma.wishlistItem.findUnique({
            where: {
                wishlist_id_product_id: {
                    wishlist_id: wishlist.wishlist_id,
                    product_id: dto.product_id,
                },
            },
        });

        if (existingItem) {
            throw new ConflictException(WISHLIST_MESSAGES.ALREADY_IN_WISHLIST);
        }

        // Add to wishlist
        await this.prisma.wishlistItem.create({
            data: {
                wishlist_id: wishlist.wishlist_id,
                product_id: dto.product_id,
            },
        });

        return this.getWishlist(userId);
    }

    /**
     * Remove item from wishlist
     */
    async removeFromWishlist(
        userId: string,
        wishlistItemId: string,
    ): Promise<WishlistResponseDto> {
        const wishlist = await this.getOrCreateWishlist(userId);

        // Verify item exists and belongs to user
        const item = await this.prisma.wishlistItem.findFirst({
            where: {
                wishlist_item_id: wishlistItemId,
                wishlist_id: wishlist.wishlist_id,
            },
        });

        if (!item) {
            throw new NotFoundException(WISHLIST_MESSAGES.WISHLIST_ITEM_NOT_FOUND);
        }

        await this.prisma.wishlistItem.delete({
            where: { wishlist_item_id: wishlistItemId },
        });

        return this.getWishlist(userId);
    }

    /**
     * Remove item from wishlist by product ID
     */
    async removeByProductId(
        userId: string,
        productId: string,
    ): Promise<WishlistResponseDto> {
        const wishlist = await this.getOrCreateWishlist(userId);

        const item = await this.prisma.wishlistItem.findUnique({
            where: {
                wishlist_id_product_id: {
                    wishlist_id: wishlist.wishlist_id,
                    product_id: productId,
                },
            },
        });

        if (!item) {
            throw new NotFoundException(WISHLIST_MESSAGES.WISHLIST_ITEM_NOT_FOUND);
        }

        await this.prisma.wishlistItem.delete({
            where: { wishlist_item_id: item.wishlist_item_id },
        });

        return this.getWishlist(userId);
    }

    /**
     * Clear entire wishlist
     */
    async clearWishlist(userId: string): Promise<{ message: string }> {
        const wishlist = await this.getOrCreateWishlist(userId);

        await this.prisma.wishlistItem.deleteMany({
            where: { wishlist_id: wishlist.wishlist_id },
        });

        return { message: WISHLIST_MESSAGES.WISHLIST_CLEARED };
    }

    /**
     * Check if product is in user's wishlist
     */
    async isInWishlist(
        userId: string,
        productId: string,
    ): Promise<WishlistCheckResponseDto> {
        const wishlist = await this.prisma.wishlist.findUnique({
            where: { user_id: userId },
        });

        if (!wishlist) {
            return { is_in_wishlist: false };
        }

        const item = await this.prisma.wishlistItem.findUnique({
            where: {
                wishlist_id_product_id: {
                    wishlist_id: wishlist.wishlist_id,
                    product_id: productId,
                },
            },
        });

        return {
            is_in_wishlist: !!item,
            wishlist_item_id: item?.wishlist_item_id,
        };
    }

    /**
     * Toggle wishlist status for a product
     */
    async toggleWishlist(
        userId: string,
        productId: string,
    ): Promise<{ added: boolean; wishlist: WishlistResponseDto }> {
        const checkResult = await this.isInWishlist(userId, productId);

        if (checkResult.is_in_wishlist) {
            const wishlist = await this.removeByProductId(userId, productId);
            return { added: false, wishlist };
        } else {
            const wishlist = await this.addToWishlist(userId, { product_id: productId });
            return { added: true, wishlist };
        }
    }

    /**
     * Move item from wishlist to cart
     */
    async moveToCart(
        userId: string,
        wishlistItemId: string,
    ): Promise<{ message: string }> {
        const wishlist = await this.getOrCreateWishlist(userId);

        // Verify item exists and belongs to user
        const item = await this.prisma.wishlistItem.findFirst({
            where: {
                wishlist_item_id: wishlistItemId,
                wishlist_id: wishlist.wishlist_id,
            },
            include: {
                product: {
                    select: {
                        product_id: true,
                        inventory_count: true,
                        status: true,
                        is_deleted: true,
                    },
                },
            },
        });

        if (!item) {
            throw new NotFoundException(WISHLIST_MESSAGES.WISHLIST_ITEM_NOT_FOUND);
        }

        // Verify product is still available
        if (item.product.is_deleted) {
            throw new BadRequestException(WISHLIST_MESSAGES.PRODUCT_UNAVAILABLE);
        }

        if (item.product.status !== WISHLIST_CONSTANTS.APPROVED_STATUS) {
            throw new BadRequestException(WISHLIST_MESSAGES.PRODUCT_NOT_APPROVED);
        }

        if (item.product.inventory_count <= 0) {
            throw new BadRequestException(WISHLIST_MESSAGES.PRODUCT_OUT_OF_STOCK);
        }

        // Add to cart
        await this.cartService.addToCart(userId, {
            product_id: item.product_id,
            quantity: 1,
        });

        // Remove from wishlist
        await this.prisma.wishlistItem.delete({
            where: { wishlist_item_id: wishlistItemId },
        });

        return { message: WISHLIST_MESSAGES.MOVED_TO_CART };
    }

    /**
     * Get wishlist summary
     */
    async getWishlistSummary(userId: string): Promise<WishlistSummaryDto> {
        const wishlist = await this.prisma.wishlist.findUnique({
            where: { user_id: userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                price_cents: true,
                                currency: true,
                                status: true,
                                is_deleted: true,
                            },
                        },
                    },
                },
            },
        });

        if (!wishlist) {
            return {
                item_count: 0,
                total_value_cents: 0,
                currency: 'INR',
            };
        }

        const validItems = wishlist.items.filter(
            (item) =>
                !item.product.is_deleted &&
                item.product.status === WISHLIST_CONSTANTS.APPROVED_STATUS,
        );

        return this.calculateSummary(validItems);
    }

    /**
     * Calculate wishlist summary
     */
    private calculateSummary(wishlistItems: any[]): WishlistSummaryDto {
        const totalValueCents = wishlistItems.reduce(
            (sum, item) => sum + item.product.price_cents,
            0,
        );

        return {
            item_count: wishlistItems.length,
            total_value_cents: totalValueCents,
            currency: 'INR',
        };
    }
}
