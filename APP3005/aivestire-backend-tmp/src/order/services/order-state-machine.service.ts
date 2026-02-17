import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, Order } from '@prisma/client';

@Injectable()
export class OrderStateMachineService {
    private readonly transitions: Record<OrderStatus, OrderStatus[]> = {
        PENDING: ['BOOKED', 'CANCELLED'],
        BOOKED: ['DISPATCHED', 'CANCELLED'],
        DISPATCHED: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['OUT_FOR_DELIVERY'],
        OUT_FOR_DELIVERY: ['DELIVERED'],
        DELIVERED: [],
        CANCELLED: [],
    };

    private readonly cancellableStates: OrderStatus[] = [
        'PENDING',
        'BOOKED',
        'DISPATCHED',
    ];

    /**
     * Check if transition from one status to another is valid
     */
    canTransition(from: OrderStatus, to: OrderStatus): boolean {
        const allowedStates = this.transitions[from];
        return allowedStates?.includes(to) ?? false;
    }

    /**
     * Check if order can be cancelled in current state
     */
    canCancel(currentStatus: OrderStatus): boolean {
        return this.cancellableStates.includes(currentStatus);
    }

    /**
     * Validate COD collection before marking as delivered
     */
    validateCOD(order: Order, newStatus: OrderStatus): void {
        if (
            order.payment_method === PaymentMethod.COD &&
            newStatus === OrderStatus.DELIVERED
        ) {
            if (!order.cod_collected) {
                throw new BadRequestException(
                    'COD payment must be collected before marking as delivered',
                );
            }
        }
    }

    /**
     * Comprehensive validation before state transition
     */
    validateTransition(order: Order, newStatus: OrderStatus): void {
        // Check if transition is valid
        if (!this.canTransition(order.current_status, newStatus)) {
            throw new BadRequestException(
                `Invalid state transition from ${order.current_status} to ${newStatus}`,
            );
        }

        // Check if already in terminal state
        if (
            order.current_status === OrderStatus.DELIVERED ||
            order.current_status === OrderStatus.CANCELLED
        ) {
            throw new BadRequestException(
                `Cannot change status from terminal state: ${order.current_status}`,
            );
        }

        // COD validation
        this.validateCOD(order, newStatus);
    }

    /**
     * Validate cancellation request
     */
    validateCancellation(order: Order): void {
        if (!this.canCancel(order.current_status)) {
            throw new BadRequestException(
                `Cannot cancel order in ${order.current_status} state. Only orders in PENDING, BOOKED, or DISPATCHED state can be cancelled.`,
            );
        }

        if (order.current_status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Order is already cancelled');
        }

        if (order.current_status === OrderStatus.DELIVERED) {
            throw new BadRequestException(
                'Cannot cancel delivered order. Please initiate a return instead.',
            );
        }
    }

    /**
     * Get all allowed next states for current order status
     */
    getAllowedNextStates(currentStatus: OrderStatus): OrderStatus[] {
        return this.transitions[currentStatus] || [];
    }
}
