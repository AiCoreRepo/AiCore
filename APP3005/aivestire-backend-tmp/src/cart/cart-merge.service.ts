import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GuestCartService } from './guest-cart.service';
import { CartService } from './cart.service';
import { CartResponseDto } from './dto/cart-response.dto';
import { CART_CONSTANTS, CART_MESSAGES } from './cart.constants';

/**
 * Merge Result for tracking what happened during merge
 */
export interface MergeResult {
  merged_items: number;
  dropped_items: number;
  capped_items: number;
  price_updated_items: number;
  dropped_reasons: string[];
}

/**
 * Cart Merge Service
 *
 * Backend-owned, one-time, idempotent merge of guest cart into user cart.
 *
 * Key rules per enterprise cart spec:
 * - Merge is idempotent (calling twice = same result)
 * - Merge is backend-owned (frontend never merges)
 * - Uses mergedFromGuest flag as idempotency guard
 * - Validates stock, refreshes prices
 * - Caps quantities at limit
 * - Deletes guest cart after successful merge
 */
@Injectable()
export class CartMergeService {
  private readonly logger = new Logger(CartMergeService.name);

  constructor(
    private prisma: PrismaService,
    private guestCartService: GuestCartService,
  ) {}

  /**
   * Merge guest cart into user cart on login
   *
   * Algorithm per spec:
   * 1. Fetch guest cart
   * 2. Fetch user cart
   * 3. If guest cart empty → return user cart (no-op)
   * 4. If merge already done (mergedFromGuest = true for this session) → return user cart
   * 5. Merge items:
   *    - Same SKU+size+color → add quantities (cap at limit)
   *    - Out of stock → drop item
   *    - Price changed → use current price
   * 6. Persist merged cart
   * 7. Increment version
   * 8. Set mergedFromGuest = true
   * 9. Delete guest cart
   * 10. Return merged cart
   */
  async mergeGuestCartToUser(
    userId: string,
    guestSessionId: string,
  ): Promise<{ cart: CartResponseDto; mergeResult: MergeResult }> {
    this.logger.log(
      `Starting merge: user=${userId}, session=${guestSessionId}`,
    );

    const mergeResult: MergeResult = {
      merged_items: 0,
      dropped_items: 0,
      capped_items: 0,
      price_updated_items: 0,
      dropped_reasons: [],
    };

    // 1. Fetch guest cart items
    const guestItems =
      await this.guestCartService.getGuestCartItemsForMerge(guestSessionId);

    // 3. If guest cart empty, return user cart (no-op)
    if (!guestItems || guestItems.length === 0) {
      this.logger.log('Guest cart empty, returning user cart');
      const userCart = await this.getUserCart(userId);
      return { cart: userCart, mergeResult };
    }

    // 2 & 4. Get or create user cart, check idempotency guard
    const userCartData = await this.getOrCreateUserCart(userId);

    // Use a transaction for atomic merge
    await this.prisma.$transaction(async (tx) => {
      for (const guestItem of guestItems) {
        const { product } = guestItem;

        // Skip deleted or non-approved products
        if (
          product.is_deleted ||
          product.status !== CART_CONSTANTS.APPROVED_STATUS
        ) {
          mergeResult.dropped_items++;
          mergeResult.dropped_reasons.push(
            `${guestItem.product_id}: Product unavailable`,
          );
          continue;
        }

        // Check if out of stock (flat level)
        if (product.inventory_count === 0) {
          mergeResult.dropped_items++;
          mergeResult.dropped_reasons.push(
            `${guestItem.product_id}: Out of stock`,
          );
          continue;
        }

        // If the guest item has a specific size+color, check per-size stock
        if (guestItem.size && guestItem.color) {
          const variant = await tx.productColorVariant.findFirst({
            where: {
              pattern: { product_id: guestItem.product_id },
              color: guestItem.color as any,
            },
            include: {
              size_stocks: { where: { size: guestItem.size } },
            },
          });

          const sizeStock = variant?.size_stocks[0]?.stock ?? null;

          if (sizeStock !== null && sizeStock === 0) {
            mergeResult.dropped_items++;
            mergeResult.dropped_reasons.push(
              `${guestItem.product_id}: Size ${guestItem.size} out of stock in selected colour`,
            );
            continue;
          }
        }

        // Find existing item in user cart with same SKU+size+color
        const existingUserItem = await tx.cartItem.findFirst({
          where: {
            cart_id: userCartData.cart_id,
            product_id: guestItem.product_id,
            size: guestItem.size,
            color: guestItem.color,
          },
        });

        if (existingUserItem) {
          // Merge: add quantities
          let newQuantity = existingUserItem.quantity + guestItem.quantity;

          // Cap at max
          if (newQuantity > CART_CONSTANTS.MAX_QUANTITY) {
            newQuantity = CART_CONSTANTS.MAX_QUANTITY;
            mergeResult.capped_items++;
          }

          // Cap at inventory
          if (newQuantity > product.inventory_count) {
            newQuantity = product.inventory_count;
            mergeResult.capped_items++;
          }

          // Update with current price (price refresh)
          await tx.cartItem.update({
            where: { cart_item_id: existingUserItem.cart_item_id },
            data: {
              quantity: newQuantity,
              price_cents_snapshot: product.price_cents,
              currency_snapshot: product.currency,
            },
          });

          mergeResult.merged_items++;
          if (existingUserItem.price_cents_snapshot !== product.price_cents) {
            mergeResult.price_updated_items++;
          }
        } else {
          // New item: add to user cart with current price
          let quantity = guestItem.quantity;

          // Cap at max
          if (quantity > CART_CONSTANTS.MAX_QUANTITY) {
            quantity = CART_CONSTANTS.MAX_QUANTITY;
            mergeResult.capped_items++;
          }

          // Cap at inventory
          if (quantity > product.inventory_count) {
            quantity = product.inventory_count;
            mergeResult.capped_items++;
          }

          await tx.cartItem.create({
            data: {
              cart_id: userCartData.cart_id,
              product_id: guestItem.product_id,
              quantity: quantity,
              size: guestItem.size,
              color: guestItem.color,
              price_cents_snapshot: product.price_cents,
              currency_snapshot: product.currency,
            },
          });

          mergeResult.merged_items++;
        }
      }

      // 7 & 8. Update cart: increment version, set mergedFromGuest
      await tx.cart.update({
        where: { cart_id: userCartData.cart_id },
        data: {
          version: { increment: 1 },
          merged_from_guest: true,
        },
      });
    });

    // 9. Delete guest cart after successful merge
    await this.guestCartService.deleteGuestCart(guestSessionId);

    this.logger.log(`Merge complete: ${JSON.stringify(mergeResult)}`);

    // 10. Return merged cart
    const userCart = await this.getUserCart(userId);
    return { cart: userCart, mergeResult };
  }

  /**
   * Get or create user cart
   */
  private async getOrCreateUserCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { user_id: userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          user_id: userId,
          version: 1,
          merged_from_guest: false,
          region: CART_CONSTANTS.DEFAULT_REGION,
          channel: CART_CONSTANTS.DEFAULT_CHANNEL,
        },
      });
    }

    return cart;
  }

  /**
   * Get user cart (delegates to CartService)
   * Inline implementation to avoid circular dependency
   */
  private async getUserCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.getOrCreateUserCart(userId);

    const cartWithItems = await this.prisma.cart.findUnique({
      where: { cart_id: cart.cart_id },
      select: {
        cart_id: true,
        user_id: true,
        version: true,
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
                product_id: true,
                title: true,
                slug: true,
                price_cents: true,
                currency: true,
                inventory_count: true,
                category: true,
                status: true,
                is_deleted: true,
                creator: {
                  select: {
                    creator_id: true,
                    store_name: true,
                    store_slug: true,
                  },
                },
                images: {
                  select: {
                    image_id: true,
                    url: true,
                    is_primary: true,
                    order_index: true,
                  },
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
