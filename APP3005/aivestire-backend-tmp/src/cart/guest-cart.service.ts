import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import {
  CART_CONSTANTS,
  CART_MESSAGES,
  CART_QUERY_SELECT,
} from './cart.constants';

// Response types for guest cart
export interface GuestCartItemResponse {
  guest_cart_item_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  price_cents_snapshot: number;
  currency_snapshot: string;
  added_at: Date;
  product: {
    product_id: string;
    title: string;
    slug: string;
    price_cents: number;
    currency: string;
    inventory_count: number;
    category: string;
    creator: {
      creator_id: string;
      store_name: string;
      store_slug: string;
    };
    images: Array<{
      image_id: string;
      url: string;
      is_primary: boolean;
      order_index: number;
    }>;
  };
}

export interface GuestCartResponse {
  guest_cart_id: string;
  session_id: string;
  expires_at: Date;
  items: GuestCartItemResponse[];
  summary: {
    item_count: number;
    subtotal_cents: number;
    tax_cents: number;
    shipping_cents: number;
    discount_cents: number;
    total_cents: number;
    currency: string;
  };
}

/**
 * Guest Cart Service
 *
 * Manages cart functionality for unauthenticated users using session cookies.
 *
 * Key rules per enterprise cart spec:
 * - Cart tied to guest_session_id cookie (NOT localStorage)
 * - Session-based isolation
 * - Expires after inactivity
 * - Backend is source of truth
 */
@Injectable()
export class GuestCartService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get expiry date for guest cart
   */
  private getExpiryDate(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + CART_CONSTANTS.GUEST_CART_EXPIRY_DAYS);
    return expiry;
  }

  /**
   * Get or create guest cart for session
   */
  async getOrCreateGuestCart(sessionId: string) {
    let cart = await this.prisma.guestCart.findUnique({
      where: { session_id: sessionId },
    });

    if (!cart) {
      cart = await this.prisma.guestCart.create({
        data: {
          session_id: sessionId,
          region: CART_CONSTANTS.DEFAULT_REGION,
          channel: CART_CONSTANTS.DEFAULT_CHANNEL,
          expires_at: this.getExpiryDate(),
        },
      });
    } else {
      // Extend expiry on activity
      await this.prisma.guestCart.update({
        where: { guest_cart_id: cart.guest_cart_id },
        data: { expires_at: this.getExpiryDate() },
      });
    }

    return cart;
  }

  /**
   * Get guest cart with all items and product details
   */
  async getGuestCart(sessionId: string): Promise<GuestCartResponse> {
    const cart = await this.getOrCreateGuestCart(sessionId);

    const cartWithItems = await this.prisma.guestCart.findUnique({
      where: { guest_cart_id: cart.guest_cart_id },
      select: {
        guest_cart_id: true,
        session_id: true,
        expires_at: true,
        items: {
          select: {
            guest_cart_item_id: true,
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
                  orderBy: { order_index: 'asc' },
                  take: 3,
                },
              },
            },
          },
          orderBy: { added_at: 'desc' },
        },
      },
    });

    if (!cartWithItems) {
      throw new Error('Guest cart not found');
    }

    const summary = this.calculateSummary(cartWithItems.items);

    return {
      guest_cart_id: cartWithItems.guest_cart_id,
      session_id: cartWithItems.session_id,
      expires_at: cartWithItems.expires_at,
      items: cartWithItems.items.map((item) => ({
        guest_cart_item_id: item.guest_cart_item_id,
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
   * Add item to guest cart
   */
  async addToGuestCart(
    sessionId: string,
    dto: AddToCartDto,
  ): Promise<GuestCartResponse> {
    // Verify product exists and is available
    const product = await this.prisma.product.findUnique({
      where: { product_id: dto.product_id },
      select: CART_QUERY_SELECT.PRODUCT,
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

    // Check inventory (size-specific if size and color are specified)
    const quantity = dto.quantity ?? 1;
    let sizeStockCount = product.inventory_count;
    let isSizeStockChecked = false;

    if (dto.size && dto.color) {
      const variant = await this.prisma.productColorVariant.findFirst({
        where: {
          pattern: { product_id: dto.product_id },
          color: dto.color as any,
        },
        include: {
          size_stocks: {
            where: { size: dto.size },
          },
        },
      });

      if (variant) {
        const sizeStock = variant.size_stocks[0];
        sizeStockCount = sizeStock ? sizeStock.stock : 0;
        isSizeStockChecked = true;
      }
    }

    if (isSizeStockChecked) {
      if (sizeStockCount < quantity) {
        throw new BadRequestException(
          `Insufficient inventory. Only ${sizeStockCount} items available for Size ${dto.size} of this color.`,
        );
      }
    } else {
      if (product.inventory_count < quantity) {
        throw new BadRequestException(
          CART_MESSAGES.INSUFFICIENT_INVENTORY.replace(
            '{count}',
            product.inventory_count.toString(),
          ),
        );
      }
    }

    const cart = await this.getOrCreateGuestCart(sessionId);

    // Check if product with same variant already in cart
    const existingItem = await this.prisma.guestCartItem.findFirst({
      where: {
        guest_cart_id: cart.guest_cart_id,
        product_id: dto.product_id,
        size: dto.size || null,
        color: dto.color || null,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > CART_CONSTANTS.MAX_QUANTITY) {
        throw new BadRequestException(CART_MESSAGES.MAX_QUANTITY_EXCEEDED);
      }

      if (isSizeStockChecked) {
        if (newQuantity > sizeStockCount) {
          throw new BadRequestException(
            `Insufficient inventory. Only ${sizeStockCount} items available for Size ${dto.size} of this color.`,
          );
        }
      } else {
        if (newQuantity > product.inventory_count) {
          throw new BadRequestException(
            CART_MESSAGES.INSUFFICIENT_INVENTORY.replace(
              '{count}',
              product.inventory_count.toString(),
            ),
          );
        }
      }

      await this.prisma.guestCartItem.update({
        where: { guest_cart_item_id: existingItem.guest_cart_item_id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.guestCartItem.create({
        data: {
          guest_cart_id: cart.guest_cart_id,
          product_id: dto.product_id,
          quantity: quantity,
          size: dto.size || null,
          color: dto.color || null,
          price_cents_snapshot: product.price_cents,
          currency_snapshot: product.currency,
        },
      });
    }

    return this.getGuestCart(sessionId);
  }

  /**
   * Update guest cart item quantity
   */
  async updateGuestCartItem(
    sessionId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
  ): Promise<GuestCartResponse> {
    const cartItem = await this.prisma.guestCartItem.findUnique({
      where: { guest_cart_item_id: cartItemId },
      select: {
        guest_cart_item_id: true,
        product_id: true,
        size: true,
        color: true,
        guest_cart: {
          select: { session_id: true },
        },
        product: {
          select: { inventory_count: true },
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException(CART_MESSAGES.CART_ITEM_NOT_FOUND);
    }

    if (cartItem.guest_cart.session_id !== sessionId) {
      throw new NotFoundException(CART_MESSAGES.CART_ITEM_NOT_FOUND);
    }

    if (dto.quantity > CART_CONSTANTS.MAX_QUANTITY) {
      throw new BadRequestException(CART_MESSAGES.MAX_QUANTITY_EXCEEDED);
    }

    // Check inventory
    let targetStockCount = cartItem.product.inventory_count;
    let isSizeChecked = false;

    if (cartItem.size && cartItem.color) {
      const variant = await this.prisma.productColorVariant.findFirst({
        where: {
          pattern: { product_id: cartItem.product_id },
          color: cartItem.color as any,
        },
        include: {
          size_stocks: {
            where: { size: cartItem.size },
          },
        },
      });

      if (variant) {
        const sizeStock = variant.size_stocks[0];
        targetStockCount = sizeStock ? sizeStock.stock : 0;
        isSizeChecked = true;
      }
    }

    if (isSizeChecked) {
      if (targetStockCount < dto.quantity) {
        throw new BadRequestException(
          `Insufficient inventory. Only ${targetStockCount} items available for Size ${cartItem.size} of this color.`,
        );
      }
    } else {
      if (cartItem.product.inventory_count < dto.quantity) {
        throw new BadRequestException(
          CART_MESSAGES.INSUFFICIENT_INVENTORY.replace(
            '{count}',
            cartItem.product.inventory_count.toString(),
          ),
        );
      }
    }

    await this.prisma.guestCartItem.update({
      where: { guest_cart_item_id: cartItemId },
      data: { quantity: dto.quantity },
    });

    return this.getGuestCart(sessionId);
  }

  /**
   * Remove item from guest cart
   */
  async removeFromGuestCart(
    sessionId: string,
    cartItemId: string,
  ): Promise<GuestCartResponse> {
    const cartItem = await this.prisma.guestCartItem.findUnique({
      where: { guest_cart_item_id: cartItemId },
      select: {
        guest_cart_item_id: true,
        guest_cart: {
          select: { session_id: true },
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException(CART_MESSAGES.CART_ITEM_NOT_FOUND);
    }

    if (cartItem.guest_cart.session_id !== sessionId) {
      throw new NotFoundException(CART_MESSAGES.CART_ITEM_NOT_FOUND);
    }

    await this.prisma.guestCartItem.delete({
      where: { guest_cart_item_id: cartItemId },
    });

    return this.getGuestCart(sessionId);
  }

  /**
   * Clear entire guest cart
   */
  async clearGuestCart(sessionId: string): Promise<{ message: string }> {
    const cart = await this.prisma.guestCart.findUnique({
      where: { session_id: sessionId },
    });

    if (cart) {
      await this.prisma.guestCartItem.deleteMany({
        where: { guest_cart_id: cart.guest_cart_id },
      });
    }

    return { message: CART_MESSAGES.CART_CLEARED };
  }

  /**
   * Delete guest cart entirely (used after merge)
   */
  async deleteGuestCart(sessionId: string): Promise<void> {
    await this.prisma.guestCart.deleteMany({
      where: { session_id: sessionId },
    });
  }

  /**
   * Get guest cart items for merge (raw data)
   */
  async getGuestCartItemsForMerge(sessionId: string) {
    const cart = await this.prisma.guestCart.findUnique({
      where: { session_id: sessionId },
      select: {
        guest_cart_id: true,
        items: {
          select: {
            product_id: true,
            quantity: true,
            size: true,
            color: true,
            product: {
              select: {
                price_cents: true,
                currency: true,
                inventory_count: true,
                is_deleted: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return cart?.items || [];
  }

  /**
   * Calculate cart summary
   */
  private calculateSummary(cartItems: any[]) {
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const subtotalCents = cartItems.reduce(
      (sum, item) => sum + item.product.price_cents * item.quantity,
      0,
    );

    const taxCents = Math.round(subtotalCents * CART_CONSTANTS.TAX_RATE);

    const shippingCents =
      subtotalCents >= CART_CONSTANTS.FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : CART_CONSTANTS.STANDARD_SHIPPING_CENTS;

    const discountCents = 0;

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
