import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStateMachineService } from './order-state-machine.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { CollectCODDto } from '../dto/collect-cod.dto';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ChangedByType,
  UserRole,
  Prisma,
} from '@prisma/client';
import { OrderBookedEvent } from '../events/order-booked.event';
import { OrderShippedEvent } from '../events/order-shipped.event';
import { OrderOutForDeliveryEvent } from '../events/order-out-for-delivery.event';
import { OrderDeliveredEvent } from '../events/order-delivered.event';
import { OrderCancelledEvent } from '../events/order-cancelled.event';
import { OrderCalculations, OrderValidations, OrderUtils } from '../utils';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: OrderStateMachineService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async ensureInventoryDeducted(
    tx: Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: { order_id: orderId },
      select: {
        order_id: true,
        inventory_deducted: true,
        items: {
          select: {
            product_id: true,
            quantity: true,
            product: {
              select: {
                inventory_count: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.inventory_deducted) {
      return;
    }

    for (const item of order.items) {
      OrderValidations.validateInventory(
        item.product.inventory_count,
        item.quantity,
        item.product.title,
      );
    }

    for (const item of order.items) {
      await tx.product.update({
        where: { product_id: item.product_id },
        data: {
          inventory_count: {
            decrement: item.quantity,
          },
        },
      });
    }

    await tx.order.update({
      where: { order_id: orderId },
      data: { inventory_deducted: true },
    });
  }

  private async restoreDeductedInventory(
    tx: Prisma.TransactionClient,
    orderId: string,
  ): Promise<void> {
    const order = await tx.order.findUnique({
      where: { order_id: orderId },
      select: {
        order_id: true,
        inventory_deducted: true,
        items: {
          select: {
            product_id: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.inventory_deducted) {
      return;
    }

    for (const item of order.items) {
      await tx.product.update({
        where: { product_id: item.product_id },
        data: {
          inventory_count: {
            increment: item.quantity,
          },
        },
      });
    }

    await tx.order.update({
      where: { order_id: orderId },
      data: { inventory_deducted: false },
    });
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const count = await this.prisma.order.count();
    return OrderUtils.generateOrderNumber(count);
  }

  /**
   * Create a new order from cart items
   */
  async createOrder(userId: string, dto: CreateOrderDto) {
    console.log(
      'OrderService: createOrder called with items:',
      dto.items.length,
    );
    this.logger.log(`Creating order for user ${userId}`);

    // Validate shipping address belongs to user
    const shippingAddress = await this.prisma.userAddress.findFirst({
      where: {
        address_id: dto.shippingAddressId,
        user_id: userId,
      },
    });

    if (!shippingAddress) {
      throw new BadRequestException('Invalid shipping address');
    }

    // Fetch product details and validate inventory
    const productIds = OrderUtils.extractProductIds(dto.items);
    const products = await this.prisma.product.findMany({
      where: {
        product_id: { in: productIds },
        is_deleted: false,
        status: 'APPROVED',
      },
      include: {
        images: {
          where: { is_primary: true },
          take: 1,
        },
      },
    });

    // Validate all products were found
    OrderValidations.validateProductsFound(products.length, productIds.length);

    // Calculate total and prepare order items
    const orderItems = dto.items.map((item) => {
      const product = products.find((p) => p.product_id === item.productId);

      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      // Validate inventory using utility
      OrderValidations.validateInventory(
        product.inventory_count,
        item.quantity,
        product.title,
      );

      const unitPrice = product.price_cents / 100;
      const totalPrice = OrderCalculations.calculateItemTotal(
        item.quantity,
        unitPrice,
      );

      return {
        product: {
          connect: { product_id: product.product_id },
        },
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        product_name: product.title,
        product_image: product.images[0]?.url || undefined,
        size: item.size || undefined,
        color: item.color || undefined,
        variant_details:
          item.size || item.color
            ? { size: item.size, color: item.color }
            : undefined,
      };
    });
    // Calculate total amount using utility
    const grossTotal = OrderCalculations.calculateOrderTotal(
      orderItems.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unit_price,
      })),
    );

    // ── Apply coupon discount (if provided) ─────────────────────────────
    let couponDiscount = 0;
    let appliedCouponId: string | null = null;

    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findFirst({
        where: {
          code: dto.couponCode.toUpperCase(),
          status: 'ACTIVE',
          is_deleted: false,
          start_date: { lte: new Date() },
          end_date: { gte: new Date() },
        },
      });

      if (coupon) {
        // Check usage limit
        const withinLimit = coupon.max_usage === 0 || coupon.current_usage < coupon.max_usage;
        // Check min order (gross in rupees)
        const grossRupees = grossTotal;
        const minOrder = Number(coupon.min_order_amount ?? 0);
        const meetsMin = grossRupees >= minOrder;

        if (withinLimit && meetsMin) {
          const discountVal = Number(coupon.discount_value);
          if (coupon.discount_type === 'PERCENTAGE') {
            couponDiscount = (grossTotal * discountVal) / 100;
          } else {
            // FLAT discount in rupees
            couponDiscount = discountVal;
          }
          couponDiscount = Math.min(couponDiscount, grossTotal); // never exceed order value
          appliedCouponId = coupon.coupon_id;
        }
      }
    }

    const totalAmount = Math.max(0, grossTotal - couponDiscount);

    console.log(
      'Total Amount:',
      totalAmount,
      couponDiscount ? `(coupon -₹${couponDiscount})` : '',
    );

    // Check wallet balance if payment method is WALLET
    let userWallet: any = null;
    if (
      dto.paymentMethod === ('WALLET' as any) ||
      dto.paymentMethod === PaymentMethod.WALLET
    ) {
      userWallet = await this.prisma.wallet.findUnique({ where: { user_id: userId } });
      if (!userWallet || Number(userWallet.balance) < totalAmount) {
        throw new BadRequestException('Insufficient wallet balance. Please choose another payment method.');
      }
    }

    // COD and WALLET orders are instantly confirmed/booked. Prepaid wait for payment.
    const initialStatus =
      dto.paymentMethod === PaymentMethod.COD ||
      dto.paymentMethod === PaymentMethod.WALLET
        ? OrderStatus.BOOKED
        : OrderStatus.PENDING;
    const initialPaymentStatus =
      dto.paymentMethod === PaymentMethod.WALLET
        ? PaymentStatus.COMPLETED
        : PaymentStatus.PENDING;

    // Create order in transaction
    const order = await this.prisma.$transaction(
      async (tx) => {
        const orderNumber = await this.generateOrderNumber();

        // Create status history entries
        const statusHistoryEntries: any[] = [
          {
            from_status: null,
            to_status: OrderStatus.PENDING,
            changed_by_type: ChangedByType.SYSTEM,
            notes: 'Order created',
          },
        ];

        if (initialStatus === OrderStatus.BOOKED) {
          statusHistoryEntries.push({
            from_status: OrderStatus.PENDING,
            to_status: OrderStatus.BOOKED,
            changed_by_type: ChangedByType.SYSTEM,
            notes: dto.paymentMethod === PaymentMethod.WALLET ? 'Wallet order auto-confirmed and paid' : 'COD order auto-confirmed',
          });
        }

        // Create order
        const newOrder = await tx.order.create({
          data: {
            order_number: orderNumber,
            user_id: userId,
            total_amount: totalAmount,
            payment_method: dto.paymentMethod,
            payment_status: initialPaymentStatus,
            current_status: initialStatus,
            shipping_address_id: dto.shippingAddressId,
            estimated_delivery_date: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ), // 7 days from now
            items: {
              create: orderItems,
            },
            status_history: {
              create: statusHistoryEntries,
            },
          },
          include: {
            items: true,
            shipping_address: true,
          },
        });

        if (initialStatus === OrderStatus.BOOKED) {
          await this.ensureInventoryDeducted(tx, newOrder.order_id);
        }

        // Deduct wallet balance if paid with wallet
        if (dto.paymentMethod === PaymentMethod.WALLET && userWallet) {
          await tx.wallet.update({
            where: { wallet_id: userWallet.wallet_id },
            data: { balance: { decrement: totalAmount } }
          });

          await tx.walletTransaction.create({
            data: {
              wallet_id: userWallet.wallet_id,
              type: 'DEBIT',
              source: 'ORDER_PAYMENT',
              amount: totalAmount,
              reference_id: orderNumber,
              description: `Payment for Order #${orderNumber}`,
              status: 'SUCCESS'
            }
          });
        }

        // Increment coupon usage if one was applied
        if (appliedCouponId) {
          await tx.coupon.update({
            where: { coupon_id: appliedCouponId },
            data: { current_usage: { increment: 1 } },
          });
        }

        return newOrder;
      },
      {
        isolationLevel: 'Serializable', // Prevent race conditions
      },
    );

    this.logger.log(`Order created successfully: ${order.order_number}`);

    // If initial status is BOOKED (e.g. COD), trigger the BOOKED event so emails are sent instantly.
    if (order.current_status === OrderStatus.BOOKED) {
      this.emitStatusEvent(order);
    }

    return order;
  }

  /**
   * Update order status with state machine validation
   */
  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    userId: string,
    userRole: UserRole,
  ) {
    this.logger.log(`Updating order ${orderId} to status ${dto.status}`);

    // Determine changed_by_type
    let changedByType: ChangedByType;
    if (userRole === UserRole.ADMIN) {
      changedByType = ChangedByType.ADMIN;
    } else if (userRole === ('DELIVERY_PARTNER' as any)) {
      changedByType = ChangedByType.DELIVERY_PARTNER;

      // Delivery partners can only update specific statuses
      const allowedStatuses: OrderStatus[] = [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
      ];
      if (!allowedStatuses.includes(dto.status)) {
        throw new BadRequestException(
          'Delivery partners can only mark OUT_FOR_DELIVERY or DELIVERED',
        );
      }
    } else {
      throw new BadRequestException('Unauthorized to update order status');
    }

    const order = await this.prisma.$transaction(
      async (tx) => {
        // Lock the order row
        const currentOrder = await tx.order.findUnique({
          where: { order_id: orderId },
        });

        if (!currentOrder) {
          throw new NotFoundException('Order not found');
        }

        // Idempotency check for main status
        const isStatusUnchanged = currentOrder.current_status === dto.status;

        // If status is unchanged AND no other fields are provided, return early
        if (
          isStatusUnchanged &&
          !dto.trackingNumber &&
          !dto.deliveryPartner &&
          !dto.paymentStatus &&
          dto.returnStatus === undefined &&
          dto.replaceStatus === undefined &&
          !dto.notes &&
          !dto.customReason
        ) {
          this.logger.log(
            `Order already in ${dto.status} state with no metadata changes`,
          );
          return currentOrder;
        }

        // Validate transition only if the main status is changing
        if (!isStatusUnchanged) {
          const isAdmin = userRole === UserRole.ADMIN;
          this.stateMachine.validateTransition(
            currentOrder,
            dto.status,
            isAdmin,
          );
        }

        // Update order
        const updatedData: any = {
          current_status: dto.status,
          tracking_number: dto.trackingNumber || currentOrder.tracking_number,
          delivery_partner:
            dto.deliveryPartner || currentOrder.delivery_partner,
        };
        if (dto.paymentStatus) {
          updatedData.payment_status = dto.paymentStatus;
        }
        if (dto.returnStatus !== undefined) {
          updatedData.return_status =
            dto.returnStatus === '' ? null : dto.returnStatus;
        }
        if (dto.replaceStatus !== undefined) {
          updatedData.replace_status =
            dto.replaceStatus === '' ? null : dto.replaceStatus;
        }

        const updatedOrder = await tx.order.update({
          where: { order_id: orderId },
          data: updatedData,
        });

        if (!isStatusUnchanged && dto.status === OrderStatus.BOOKED) {
          await this.ensureInventoryDeducted(tx, orderId);
        }

        // Create status history
        await tx.orderStatusHistory.create({
          data: {
            order_id: orderId,
            from_status: currentOrder.current_status,
            to_status: dto.status,
            changed_by: userId,
            changed_by_type: changedByType,
            notes: dto.notes,
          },
        });

        // If COD and delivered, mark payment as completed
        if (
          updatedOrder.payment_method === PaymentMethod.COD &&
          dto.status === OrderStatus.DELIVERED
        ) {
          await tx.order.update({
            where: { order_id: orderId },
            data: {
              payment_status: PaymentStatus.COMPLETED,
            },
          });
        }

        return updatedOrder;
      },
      {
        isolationLevel: 'Serializable',
      },
    );

    // Emit events based on status
    this.emitStatusEvent(order, dto.trackingNumber);

    return order;
  }

  /**
   * Mark COD as collected
   */
  async collectCOD(orderId: string, dto: CollectCODDto) {
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.payment_method !== PaymentMethod.COD) {
      throw new BadRequestException('This is not a COD order');
    }

    if (order.cod_collected) {
      throw new BadRequestException('COD already collected');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { order_id: orderId },
      data: {
        cod_collected: true,
        cod_collected_at: new Date(),
        cod_collected_by: dto.collectedBy,
      },
    });

    this.logger.log(`COD collected for order ${order.order_number}`);

    return updatedOrder;
  }

  /**
   * Cancel order with inventory rollback
   */
  async cancelOrder(orderId: string, dto: CancelOrderDto, userId: string) {
    this.logger.log(`Cancelling order ${orderId}`);

    const order = await this.prisma.$transaction(
      async (tx) => {
        const currentOrder = await tx.order.findUnique({
          where: { order_id: orderId },
          include: { items: true },
        });

        if (!currentOrder) {
          throw new NotFoundException('Order not found');
        }

        // Validate cancellation
        this.stateMachine.validateCancellation(currentOrder);

        // Prepare cancellation data
        const cancellationReason = dto.customReason || dto.reason;

        // Update order status
        const cancelledOrder = await tx.order.update({
          where: { order_id: orderId },
          data: {
            current_status: OrderStatus.CANCELLED,
            cancelled_at: new Date(),
            cancelled_by: userId,
            cancellation_reason: cancellationReason,
            cancel_feedback: dto.feedback || null,
          },
        });

        // Create status history
        await tx.orderStatusHistory.create({
          data: {
            order_id: orderId,
            from_status: currentOrder.current_status,
            to_status: OrderStatus.CANCELLED,
            changed_by: userId,
            changed_by_type: ChangedByType.USER,
            notes: `Order cancelled: ${dto.reason}`,
          },
        });

        await this.restoreDeductedInventory(tx, orderId);

        return cancelledOrder;
      },
      {
        isolationLevel: 'Serializable',
      },
    );

    // Emit event
    this.eventEmitter.emit('order.cancelled', new OrderCancelledEvent(order));

    this.logger.log(`Order cancelled successfully: ${order.order_number}`);

    return order;
  }

  /**
   * Get order tracking details
   */
  async getOrderTracking(orderId: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { order_id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
        shipping_address: true,
        status_history: {
          orderBy: { created_at: 'asc' },
        },
        delivery_tracking: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Optional: Check ownership if userId provided
    if (userId && order.user_id !== userId) {
      throw new BadRequestException('Unauthorized to view this order');
    }

    return {
      // Explicitly select only necessary fields
      orderId: order.order_id,
      orderNumber: order.order_number,
      totalAmount: order.total_amount, // Ensure this matches frontend expectation
      total_amount: order.total_amount, // Provide both casing for compatibility
      currentStatus: order.current_status,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      trackingNumber: order.tracking_number,
      estimatedDelivery: order.estimated_delivery_date,
      createdAt: order.created_at,
      items: order.items,
      shippingAddress: order.shipping_address,
      statusHistory: order.status_history.map((h) => ({
        status: h.to_status,
        timestamp: h.created_at,
        description:
          h.notes || this.getStatusDescription(h.to_status as OrderStatus),
        changedBy: h.changed_by_type,
      })),
      deliveryTracking: order.delivery_tracking.map((t) => ({
        location: t.location_name,
        locationType: t.location_type,
        timestamp: t.created_at,
        description: t.status_description,
        coordinates:
          t.latitude && t.longitude
            ? { lat: Number(t.latitude), lng: Number(t.longitude) }
            : null,
      })),
    };
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId: string, status?: OrderStatus) {
    const orders = await this.prisma.order.findMany({
      where: {
        user_id: userId,
        ...(status && { current_status: status }),
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
        shipping_address: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return orders;
  }

  /**
   * Get all orders (Admin only)
   */
  async getAllOrders() {
    const orders = await this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { is_primary: true },
                  take: 1,
                },
              },
            },
          },
        },
        shipping_address: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return orders;
  }

  /**
   * Emit appropriate event based on order status
   */
  private emitStatusEvent(order: any, trackingNumber?: string) {
    switch (order.current_status) {
      case OrderStatus.BOOKED:
        this.eventEmitter.emit('order.booked', new OrderBookedEvent(order));
        break;
      case OrderStatus.SHIPPED:
        this.eventEmitter.emit(
          'order.shipped',
          new OrderShippedEvent(order, trackingNumber || order.tracking_number),
        );
        break;
      case OrderStatus.OUT_FOR_DELIVERY:
        this.eventEmitter.emit(
          'order.out_for_delivery',
          new OrderOutForDeliveryEvent(order),
        );
        break;
      case OrderStatus.DELIVERED:
        this.eventEmitter.emit(
          'order.delivered',
          new OrderDeliveredEvent(order),
        );
        break;
      case OrderStatus.CANCELLED:
        this.eventEmitter.emit(
          'order.cancelled',
          new OrderCancelledEvent(order),
        );
        break;
    }
  }

  /**
   * Get default status description
   */
  private getStatusDescription(status: OrderStatus): string {
    return OrderUtils.getStatusDescription(status);
  }
}
