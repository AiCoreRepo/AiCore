import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto, CartSummaryDto } from './dto/cart-response.dto';
import {
    CART_CONSTANTS,
    CART_MESSAGES,
    CART_QUERY_SELECT,
} from './cart.constants';

@Injectable()
export class CartService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get or create cart for user
     */
    private async getOrCreateCart(userId: string) {
        let cart = await this.prisma.cart.findUnique({
            where: { user_id: userId },
        });

        if (!cart) {
            cart = await this.prisma.cart.create({
                data: { user_id: userId },
            });
        }

        return cart;
    }

    /**
   * Get user's cart with all items and product details (optimized query)
   */
    async getCart(userId: string): Promise<CartResponseDto> {
        const cart = await this.getOrCreateCart(userId);

        const cartWithItems = await this.prisma.cart.findUnique({
            where: { cart_id: cart.cart_id },
            select: {
                cart_id: true,
                user_id: true,
                created_at: true,
                updated_at: true,
                items: {
                    select: {
                        cart_item_id: true,
                        product_id: true,
                        quantity: true,
                        size: true,
                        color: true,
                        price_cents_snapshot: true,
                        currency_snapshot: true,
                        added_at: true,
                        product: {
                            select: {
                                ...CART_QUERY_SELECT.PRODUCT,
                                creator: {
                                    select: CART_QUERY_SELECT.CREATOR,
                                },
                                images: {
                                    select: CART_QUERY_SELECT.IMAGE,
                                    orderBy: {
                                        order_index: 'asc',
                                    },
                                    take: 3, // Only fetch first 3 images for performance
                                },
                            },
                        },
                    },
                    orderBy: {
                        added_at: 'desc',
                    },
                },
            },
        });

        if (!cartWithItems) {
            throw new Error('Cart not found');
        }

        const summary = this.calculateSummary(cartWithItems.items);

        return {
            cart_id: cartWithItems.cart_id,
            user_id: cartWithItems.user_id,
            created_at: cartWithItems.created_at,
            updated_at: cartWithItems.updated_at,
            items: cartWithItems.items.map((item) => ({
                cart_item_id: item.cart_item_id,
                product_id: item.product_id,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                price_cents_snapshot: item.price_cents_snapshot,
                currency_snapshot: item.currency_snapshot,
                added_at: item.added_at,
                product: {
                    product_id: item.product.product_id,
                    title: item.product.title,
                    slug: item.product.slug,
                    price_cents: item.product.price_cents,
                    currency: item.product.currency,
                    inventory_count: item.product.inventory_count,
                    category: item.product.category || '',
                    creator: item.product.creator,
                    images: item.product.images,
                },
            })),
            summary,
        };
    }

    /**
   * Add item to cart
   */
    async addToCart(userId: string, dto: AddToCartDto): Promise<CartResponseDto> {
        // Verify product exists and is available (optimized query)
        const product = await this.prisma.product.findUnique({
            where: { product_id: dto.product_id },
            select: {
                ...CART_QUERY_SELECT.PRODUCT,
            },
        });

        if (!product) {
            throw new NotFoundException(CART_MESSAGES.PRODUCT_NOT_FOUND);
        }

        if (product.is_deleted) {
            throw new BadRequestException(CART_MESSAGES.PRODUCT_UNAVAILABLE);
        }

        if (product.status !== CART_CONSTANTS.APPROVED_STATUS) {
            throw new BadRequestException(CART_MESSAGES.PRODUCT_NOT_APPROVED);
        }

        // Check inventory
        const quantity = dto.quantity ?? 1;
        if (product.inventory_count < quantity) {
            throw new BadRequestException(
                CART_MESSAGES.INSUFFICIENT_INVENTORY.replace(
                    '{count}',
                    product.inventory_count.toString(),
                ),
            );
        }

        // Get or create cart
        const cart = await this.getOrCreateCart(userId);

        // Check if product already in cart (same SKU + size + color)
        const existingItem = await this.prisma.cartItem.findFirst({
            where: {
                cart_id: cart.cart_id,
                product_id: dto.product_id,
                size: dto.size || null,
                color: dto.color || null,
            },
        });

        if (existingItem) {
            // Update quantity instead of throwing error
            const newQuantity = existingItem.quantity + quantity;

            if (newQuantity > CART_CONSTANTS.MAX_QUANTITY) {
                throw new BadRequestException(CART_MESSAGES.MAX_QUANTITY_EXCEEDED);
            }

            if (newQuantity > product.inventory_count) {
                throw new BadRequestException(
                    CART_MESSAGES.INSUFFICIENT_INVENTORY.replace(
                        '{count}',
                        product.inventory_count.toString(),
                    ),
                );
            }

            await this.prisma.cartItem.update({
                where: { cart_item_id: existingItem.cart_item_id },
                data: { quantity: newQuantity },
            });
        } else {
            // Create new cart item with variant info
            await this.prisma.cartItem.create({
                data: {
                    cart_id: cart.cart_id,
                    product_id: dto.product_id,
                    quantity: quantity,
                    size: dto.size || null,
                    color: dto.color || null,
                    price_cents_snapshot: product.price_cents,
                    currency_snapshot: product.currency,
                },
            });
        }

        return this.getCart(userId);
    }

    /**
   * Update cart item quantity
   */
    async updateCartItem(
        userId: string,
        cartItemId: string,
        dto: UpdateCartItemDto,
    ): Promise<CartResponseDto> {
        // Find cart item and verify ownership
        const cartItem = await this.prisma.cartItem.findUnique({
            where: { cart_item_id: cartItemId },
            select: {
                cart_item_id: true,
                cart: {
                    select: {
                        user_id: true,
                    },
                },
                product: {
                    select: {
                        inventory_count: true,
                    },
                },
            },
        });

        if (!cartItem) {
            throw new NotFoundException(CART_MESSAGES.CART_ITEM_NOT_FOUND);
        }

        if (cartItem.cart.user_id !== userId) {
            throw new NotFoundException(CART_MESSAGES.CART_ITEM_NOT_FOUND);
        }

        // Check inventory
        if (cartItem.product.inventory_count < dto.quantity) {
            throw new BadRequestException(
                CART_MESSAGES.INSUFFICIENT_INVENTORY.replace(
                    '{count}',
                    cartItem.product.inventory_count.toString(),
                ),
            );
        }

        // Update quantity
        await this.prisma.cartItem.update({
            where: { cart_item_id: cartItemId },
            data: { quantity: dto.quantity },
        });

        return this.getCart(userId);
    }

    /**
     * Remove item from cart
     */
    async removeFromCart(
        userId: string,
        cartItemId: string,
    ): Promise<CartResponseDto> {
        // Find cart item and verify ownership
        const cartItem = await this.prisma.cartItem.findUnique({
            where: { cart_item_id: cartItemId },
            select: {
                cart_item_id: true,
                cart: {
                    select: {
                        user_id: true,
                    },
                },
            },
        });

        if (!cartItem) {
            throw new NotFoundException(CART_MESSAGES.CART_ITEM_NOT_FOUND);
        }

        if (cartItem.cart.user_id !== userId) {
            throw new NotFoundException(CART_MESSAGES.CART_ITEM_NOT_FOUND);
        }

        // Delete cart item
        await this.prisma.cartItem.delete({
            where: { cart_item_id: cartItemId },
        });

        return this.getCart(userId);
    }

    /**
   * Clear entire cart
   */
    async clearCart(userId: string): Promise<{ message: string }> {
        const cart = await this.prisma.cart.findUnique({
            where: { user_id: userId },
        });

        if (cart) {
            await this.prisma.cartItem.deleteMany({
                where: { cart_id: cart.cart_id },
            });
        }

        return { message: CART_MESSAGES.CART_CLEARED };
    }

    /**
     * Get cart summary (totals and counts)
     */
    async getCartSummary(userId: string): Promise<CartSummaryDto> {
        const cart = await this.getOrCreateCart(userId);

        const cartItems = await this.prisma.cartItem.findMany({
            where: { cart_id: cart.cart_id },
            select: {
                quantity: true,
                product: {
                    select: {
                        price_cents: true,
                    },
                },
            },
        });

        return this.calculateSummary(cartItems);
    }

    /**
     * Calculate cart summary with tax and shipping
     */
    private calculateSummary(cartItems: any[]): CartSummaryDto {
        const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

        // Use current product price for calculations
        const subtotalCents = cartItems.reduce(
            (sum, item) => sum + item.product.price_cents * item.quantity,
            0,
        );

        // Tax calculation (18% GST for India)
        const taxCents = Math.round(subtotalCents * CART_CONSTANTS.TAX_RATE);

        // Free shipping over threshold
        const shippingCents =
            subtotalCents >= CART_CONSTANTS.FREE_SHIPPING_THRESHOLD_CENTS
                ? 0
                : CART_CONSTANTS.STANDARD_SHIPPING_CENTS;

        const discountCents = 0; // Placeholder for future promo code logic

        const totalCents = subtotalCents + taxCents + shippingCents - discountCents;

        return {
            item_count: itemCount,
            subtotal_cents: subtotalCents,
            tax_cents: taxCents,
            shipping_cents: shippingCents,
            discount_cents: discountCents,
            total_cents: totalCents,
            currency: CART_CONSTANTS.DEFAULT_CURRENCY,
        };
    }
}
