import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { RequestReplacementDto } from './dto/request-replacement.dto';
import { SchedulePickupDto } from '../return/dto/schedule-pickup.dto';
import { ReplacementStatus, OrderStatus } from '@prisma/client';
import { OrderReplaceRequestedEvent } from './events/order-replace-requested.event';
import { OrderReplaceDispatchedEvent } from './events/order-replace-dispatched.event';

@Injectable()
export class ReplacementService {
    private readonly logger = new Logger(ReplacementService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /**
     * Customer requests replacement within 7 days of delivery
     */
    async requestReplacement(
        orderId: string,
        userId: string,
        dto: RequestReplacementDto,
    ) {
        this.logger.log(`Replacement requested for order ${orderId}`);

        // Validate eligibility
        await this.validateReplacementEligibility(orderId, userId);

        const order = await this.prisma.order.findUnique({
            where: { order_id: orderId },
        });

        // Create replacement request
        const replacement = await this.prisma.$transaction(async (tx) => {
            const newReplacement = await tx.orderReplacement.create({
                data: {
                    original_order_id: orderId,
                    replace_reason: dto.replace_reason,
                    custom_reason: dto.custom_reason,
                    feedback: dto.feedback,
                    replacement_status: ReplacementStatus.REQUESTED,
                },
            });

            await tx.order.update({
                where: { order_id: orderId },
                data: {
                    replace_status: ReplacementStatus.REQUESTED,
                    replace_requested_at: new Date(),
                },
            });

            return newReplacement;
        });

        this.logger.log(`Replacement request created: ${replacement.replacement_id}`);

        // Emit event
        this.eventEmitter.emit(
            'order.replace.requested',
            new OrderReplaceRequestedEvent(order!, replacement),
        );

        return replacement;
    }

    /**
     * Validate if order is eligible for replacement
     */
    async validateReplacementEligibility(orderId: string, userId: string) {
        const order = await this.prisma.order.findUnique({
            where: { order_id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.user_id !== userId) {
            throw new BadRequestException('Order does not belong to this user');
        }

        // Must be delivered
        if (order.current_status !== OrderStatus.DELIVERED) {
            throw new BadRequestException(
                'Only delivered orders can be replaced',
            );
        }

        // Check 7-day window
        const daysSinceDelivery =
            (Date.now() - order.updated_at.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceDelivery > 7) {
            throw new BadRequestException(
                'Replacement window expired. Replacements are allowed within 7 days of delivery.',
            );
        }

        // Check for duplicate replacement request
        if (
            order.replace_status === ReplacementStatus.REQUESTED ||
            order.replace_status === ReplacementStatus.APPROVED ||
            order.replace_status === ReplacementStatus.PICKUP_SCHEDULED
        ) {
            throw new BadRequestException(
                'Replacement already requested for this order',
            );
        }

        // Cannot replace if already returned
        if (order.return_status) {
            throw new BadRequestException(
                'Cannot replace order that has been returned',
            );
        }

        return true;
    }

    /**
     * Admin approves replacement and creates new order
     */
    async approveReplacement(replacementId: string, adminId: string) {
        this.logger.log(`Approving replacement ${replacementId}`);

        const replacement = await this.prisma.orderReplacement.findUnique({
            where: { replacement_id: replacementId },
            include: {
                original_order: {
                    include: {
                        items: true,
                        shipping_address: true,
                    },
                },
            },
        });

        if (!replacement) {
            throw new NotFoundException('Replacement request not found');
        }

        if (replacement.replacement_status !== ReplacementStatus.REQUESTED) {
            throw new BadRequestException(
                `Cannot approve replacement in ${replacement.replacement_status} state`,
            );
        }

        // Create new replacement order in transaction
        const updatedReplacement = await this.prisma.$transaction(async (tx) => {
            // Generate new order number
            const year = new Date().getFullYear();
            const count = await tx.order.count();
            const newOrderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}-R`;

            // Create new order (copy of original)
            const newOrder = await tx.order.create({
                data: {
                    order_number: newOrderNumber,
                    user_id: replacement.original_order.user_id,
                    total_amount: replacement.original_order.total_amount,
                    payment_method: replacement.original_order.payment_method,
                    payment_status: 'COMPLETED' as any, // Replacement is free
                    current_status: 'PENDING' as any,
                    shipping_address_id: replacement.original_order.shipping_address_id,
                    items: {
                        create: replacement.original_order.items.map((item) => ({
                            product: {
                                connect: { product_id: item.product_id },
                            },
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            total_price: item.total_price,
                            product_name: item.product_name,
                            product_image: item.product_image || undefined,
                            size: item.size || undefined,
                            color: item.color || undefined,
                            variant_details: item.variant_details || undefined,
                        })),
                    },
                    status_history: {
                        create: {
                            from_status: null,
                            to_status: 'PENDING',
                            changed_by_type: 'SYSTEM' as any,
                            notes: `Replacement order for ${replacement.original_order.order_number}`,
                        },
                    },
                },
            });

            // Update replacement record
            const updated = await tx.orderReplacement.update({
                where: { replacement_id: replacementId },
                data: {
                    replacement_status: ReplacementStatus.APPROVED,
                    approved_by: adminId,
                    approved_at: new Date(),
                    new_order_id: newOrder.order_id,
                },
            });

            // Update original order
            await tx.order.update({
                where: { order_id: replacement.original_order_id },
                data: {
                    replace_status: ReplacementStatus.APPROVED,
                },
            });

            return updated;
        });

        this.logger.log(`Replacement approved: ${replacementId}`);

        return updatedReplacement;
    }

    /**
     * Admin rejects replacement request
     */
    async rejectReplacement(
        replacementId: string,
        adminId: string,
        reason: string,
    ) {
        this.logger.log(`Rejecting replacement ${replacementId}`);

        const replacement = await this.prisma.orderReplacement.findUnique({
            where: { replacement_id: replacementId },
        });

        if (!replacement) {
            throw new NotFoundException('Replacement request not found');
        }

        if (replacement.replacement_status !== ReplacementStatus.REQUESTED) {
            throw new BadRequestException(
                `Cannot reject replacement in ${replacement.replacement_status} state`,
            );
        }

        const updatedReplacement = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReplacement.update({
                where: { replacement_id: replacementId },
                data: {
                    replacement_status: ReplacementStatus.REJECTED,
                    rejected_by: adminId,
                    rejected_at: new Date(),
                    rejection_reason: reason,
                },
            });

            await tx.order.update({
                where: { order_id: replacement.original_order_id },
                data: {
                    replace_status: ReplacementStatus.REJECTED,
                },
            });

            return updated;
        });

        this.logger.log(`Replacement rejected: ${replacementId}`);

        return updatedReplacement;
    }

    /**
     * Schedule pickup for original item
     */
    async schedulePickup(replacementId: string, dto: SchedulePickupDto) {
        this.logger.log(`Scheduling pickup for replacement ${replacementId}`);

        const replacement = await this.prisma.orderReplacement.findUnique({
            where: { replacement_id: replacementId },
        });

        if (!replacement) {
            throw new NotFoundException('Replacement request not found');
        }

        if (replacement.replacement_status !== ReplacementStatus.APPROVED) {
            throw new BadRequestException(
                'Replacement must be approved before scheduling pickup',
            );
        }

        const updatedReplacement = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReplacement.update({
                where: { replacement_id: replacementId },
                data: {
                    replacement_status: ReplacementStatus.PICKUP_SCHEDULED,
                    pickup_scheduled: new Date(dto.pickup_date),
                    pickup_partner: dto.pickup_partner,
                    pickup_tracking: dto.pickup_tracking,
                },
            });

            await tx.order.update({
                where: { order_id: replacement.original_order_id },
                data: {
                    replace_status: ReplacementStatus.PICKUP_SCHEDULED,
                },
            });

            return updated;
        });

        this.logger.log(`Pickup scheduled for replacement ${replacementId}`);

        return updatedReplacement;
    }

    /**
     * Mark original item as picked up
     */
    async markPickedUp(replacementId: string) {
        this.logger.log(`Marking replacement ${replacementId} as picked up`);

        const replacement = await this.prisma.orderReplacement.findUnique({
            where: { replacement_id: replacementId },
        });

        if (!replacement) {
            throw new NotFoundException('Replacement request not found');
        }

        const updatedReplacement = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReplacement.update({
                where: { replacement_id: replacementId },
                data: {
                    replacement_status: ReplacementStatus.PICKED_UP,
                    picked_up_at: new Date(),
                },
            });

            await tx.order.update({
                where: { order_id: replacement.original_order_id },
                data: {
                    replace_status: ReplacementStatus.PICKED_UP,
                },
            });

            return updated;
        });

        this.logger.log(`Original item picked up for replacement ${replacementId}`);

        return updatedReplacement;
    }

    /**
     * Mark new replacement item as dispatched
     */
    async markDispatched(replacementId: string, trackingNumber: string) {
        this.logger.log(`Marking replacement ${replacementId} as dispatched`);

        const replacement = await this.prisma.orderReplacement.findUnique({
            where: { replacement_id: replacementId },
            include: { original_order: true },
        });

        if (!replacement) {
            throw new NotFoundException('Replacement request not found');
        }

        const updatedReplacement = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReplacement.update({
                where: { replacement_id: replacementId },
                data: {
                    replacement_status: ReplacementStatus.DISPATCHED,
                    dispatched_at: new Date(),
                    delivery_tracking: trackingNumber,
                },
            });

            await tx.order.update({
                where: { order_id: replacement.original_order_id },
                data: {
                    replace_status: ReplacementStatus.DISPATCHED,
                },
            });

            // Update new order status to SHIPPED
            if (replacement.new_order_id) {
                await tx.order.update({
                    where: { order_id: replacement.new_order_id },
                    data: {
                        current_status: 'SHIPPED' as any,
                        tracking_number: trackingNumber,
                    },
                });
            }

            return updated;
        });

        this.logger.log(`Replacement dispatched: ${replacementId}`);

        // Emit event
        this.eventEmitter.emit(
            'order.replace.dispatched',
            new OrderReplaceDispatchedEvent(replacement.original_order, updatedReplacement),
        );

        return updatedReplacement;
    }

    /**
     * Mark new replacement item as delivered
     */
    async markDelivered(replacementId: string) {
        this.logger.log(`Marking replacement ${replacementId} as delivered`);

        const replacement = await this.prisma.orderReplacement.findUnique({
            where: { replacement_id: replacementId },
        });

        if (!replacement) {
            throw new NotFoundException('Replacement request not found');
        }

        const updatedReplacement = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReplacement.update({
                where: { replacement_id: replacementId },
                data: {
                    replacement_status: ReplacementStatus.DELIVERED,
                    delivered_at: new Date(),
                },
            });

            await tx.order.update({
                where: { order_id: replacement.original_order_id },
                data: {
                    replace_status: ReplacementStatus.DELIVERED,
                },
            });

            // Update new order status to DELIVERED
            if (replacement.new_order_id) {
                await tx.order.update({
                    where: { order_id: replacement.new_order_id },
                    data: {
                        current_status: 'DELIVERED' as any,
                    },
                });
            }

            return updated;
        });

        this.logger.log(`Replacement delivered: ${replacementId}`);

        return updatedReplacement;
    }

    /**
     * Complete replacement process
     */
    async completeReplacement(replacementId: string) {
        this.logger.log(`Completing replacement ${replacementId}`);

        const replacement = await this.prisma.orderReplacement.findUnique({
            where: { replacement_id: replacementId },
        });

        if (!replacement) {
            throw new NotFoundException('Replacement request not found');
        }

        if (replacement.replacement_status !== ReplacementStatus.DELIVERED) {
            throw new BadRequestException(
                'Replacement must be delivered before completion',
            );
        }

        const updatedReplacement = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReplacement.update({
                where: { replacement_id: replacementId },
                data: {
                    replacement_status: ReplacementStatus.COMPLETED,
                    completed_at: new Date(),
                },
            });

            await tx.order.update({
                where: { order_id: replacement.original_order_id },
                data: {
                    replace_status: ReplacementStatus.COMPLETED,
                },
            });

            return updated;
        });

        this.logger.log(`Replacement completed: ${replacementId}`);

        return updatedReplacement;
    }

    /**
     * Get replacement details for an order
     */
    async getReplacementDetails(orderId: string) {
        const replacement = await this.prisma.orderReplacement.findFirst({
            where: { original_order_id: orderId },
            orderBy: { requested_at: 'desc' },
            include: {
                original_order: true,
            },
        });

        if (!replacement) {
            throw new NotFoundException('No replacement found for this order');
        }

        return replacement;
    }

    /**
     * Get all replacements (admin)
     */
    async getAllReplacements(status?: ReplacementStatus) {
        return this.prisma.orderReplacement.findMany({
            where: status ? { replacement_status: status } : undefined,
            include: {
                original_order: {
                    include: {
                        user: {
                            select: {
                                user_id: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
            orderBy: { requested_at: 'desc' },
        });
    }
}
