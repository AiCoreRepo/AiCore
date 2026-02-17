import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { RefundService } from '../refund/refund.service';
import { RequestReturnDto } from './dto/request-return.dto';
import { SchedulePickupDto } from './dto/schedule-pickup.dto';
import { CompleteQCDto } from './dto/complete-qc.dto';
import { ReturnStatus, OrderStatus } from '@prisma/client';
import { OrderReturnRequestedEvent } from './events/order-return-requested.event';
import { OrderReturnApprovedEvent } from './events/order-return-approved.event';
import { OrderReturnCompletedEvent } from './events/order-return-completed.event';

@Injectable()
export class ReturnService {
    private readonly logger = new Logger(ReturnService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2,
        private readonly refundService: RefundService,
    ) { }

    /**
     * Customer requests return within 7 days of delivery
     */
    async requestReturn(
        orderId: string,
        userId: string,
        dto: RequestReturnDto,
    ) {
        this.logger.log(`Return requested for order ${orderId}`);

        // Validate eligibility
        await this.validateReturnEligibility(orderId, userId);

        const order = await this.prisma.order.findUnique({
            where: { order_id: orderId },
        });

        // Create return request
        const returnRequest = await this.prisma.$transaction(async (tx) => {
            const newReturn = await tx.orderReturn.create({
                data: {
                    order_id: orderId,
                    return_reason: dto.return_reason,
                    custom_reason: dto.custom_reason,
                    feedback: dto.feedback,
                    return_status: ReturnStatus.REQUESTED,
                },
            });

            await tx.order.update({
                where: { order_id: orderId },
                data: {
                    return_status: ReturnStatus.REQUESTED,
                    return_requested_at: new Date(),
                },
            });

            return newReturn;
        });

        this.logger.log(`Return request created: ${returnRequest.return_id}`);

        // Emit event
        this.eventEmitter.emit(
            'order.return.requested',
            new OrderReturnRequestedEvent(order!, returnRequest),
        );

        return returnRequest;
    }

    /**
     * Validate if order is eligible for return
     */
    async validateReturnEligibility(orderId: string, userId: string) {
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
                'Only delivered orders can be returned',
            );
        }

        // Check 7-day window
        const daysSinceDelivery =
            (Date.now() - order.updated_at.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceDelivery > 7) {
            throw new BadRequestException(
                'Return window expired. Returns are allowed within 7 days of delivery.',
            );
        }

        // Check for duplicate return request
        if (
            order.return_status === ReturnStatus.REQUESTED ||
            order.return_status === ReturnStatus.APPROVED ||
            order.return_status === ReturnStatus.PICKUP_SCHEDULED
        ) {
            throw new BadRequestException('Return already requested for this order');
        }

        // Cannot return if already replaced
        if (order.replace_status) {
            throw new BadRequestException(
                'Cannot return order that has been replaced',
            );
        }

        return true;
    }

    /**
     * Admin approves return request
     */
    async approveReturn(returnId: string, adminId: string) {
        this.logger.log(`Approving return ${returnId}`);

        const returnRequest = await this.prisma.orderReturn.findUnique({
            where: { return_id: returnId },
            include: { order: true },
        });

        if (!returnRequest) {
            throw new NotFoundException('Return request not found');
        }

        if (returnRequest.return_status !== ReturnStatus.REQUESTED) {
            throw new BadRequestException(
                `Cannot approve return in ${returnRequest.return_status} state`,
            );
        }

        const updatedReturn = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReturn.update({
                where: { return_id: returnId },
                data: {
                    return_status: ReturnStatus.APPROVED,
                    approved_by: adminId,
                    approved_at: new Date(),
                },
            });

            await tx.order.update({
                where: { order_id: returnRequest.order_id },
                data: {
                    return_status: ReturnStatus.APPROVED,
                },
            });

            return updated;
        });

        this.logger.log(`Return approved: ${returnId}`);

        // Emit event
        this.eventEmitter.emit(
            'order.return.approved',
            new OrderReturnApprovedEvent(returnRequest.order, updatedReturn),
        );

        return updatedReturn;
    }

    /**
     * Admin rejects return request
     */
    async rejectReturn(returnId: string, adminId: string, reason: string) {
        this.logger.log(`Rejecting return ${returnId}`);

        const returnRequest = await this.prisma.orderReturn.findUnique({
            where: { return_id: returnId },
        });

        if (!returnRequest) {
            throw new NotFoundException('Return request not found');
        }

        if (returnRequest.return_status !== ReturnStatus.REQUESTED) {
            throw new BadRequestException(
                `Cannot reject return in ${returnRequest.return_status} state`,
            );
        }

        const updatedReturn = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReturn.update({
                where: { return_id: returnId },
                data: {
                    return_status: ReturnStatus.REJECTED,
                    rejected_by: adminId,
                    rejected_at: new Date(),
                    rejection_reason: reason,
                },
            });

            await tx.order.update({
                where: { order_id: returnRequest.order_id },
                data: {
                    return_status: ReturnStatus.REJECTED,
                },
            });

            return updated;
        });

        this.logger.log(`Return rejected: ${returnId}`);

        return updatedReturn;
    }

    /**
     * Schedule pickup for approved return
     */
    async schedulePickup(returnId: string, dto: SchedulePickupDto) {
        this.logger.log(`Scheduling pickup for return ${returnId}`);

        const returnRequest = await this.prisma.orderReturn.findUnique({
            where: { return_id: returnId },
        });

        if (!returnRequest) {
            throw new NotFoundException('Return request not found');
        }

        if (returnRequest.return_status !== ReturnStatus.APPROVED) {
            throw new BadRequestException(
                'Return must be approved before scheduling pickup',
            );
        }

        const updatedReturn = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReturn.update({
                where: { return_id: returnId },
                data: {
                    return_status: ReturnStatus.PICKUP_SCHEDULED,
                    pickup_scheduled: new Date(dto.pickup_date),
                    pickup_partner: dto.pickup_partner,
                    pickup_tracking: dto.pickup_tracking,
                },
            });

            await tx.order.update({
                where: { order_id: returnRequest.order_id },
                data: {
                    return_status: ReturnStatus.PICKUP_SCHEDULED,
                },
            });

            return updated;
        });

        this.logger.log(`Pickup scheduled for return ${returnId}`);

        return updatedReturn;
    }

    /**
     * Mark return as picked up
     */
    async markPickedUp(returnId: string) {
        this.logger.log(`Marking return ${returnId} as picked up`);

        const returnRequest = await this.prisma.orderReturn.findUnique({
            where: { return_id: returnId },
        });

        if (!returnRequest) {
            throw new NotFoundException('Return request not found');
        }

        if (returnRequest.return_status !== ReturnStatus.PICKUP_SCHEDULED) {
            throw new BadRequestException(
                'Return must be in PICKUP_SCHEDULED state',
            );
        }

        const updatedReturn = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReturn.update({
                where: { return_id: returnId },
                data: {
                    return_status: ReturnStatus.PICKED_UP,
                    picked_up_at: new Date(),
                },
            });

            await tx.order.update({
                where: { order_id: returnRequest.order_id },
                data: {
                    return_status: ReturnStatus.PICKED_UP,
                },
            });

            return updated;
        });

        this.logger.log(`Return picked up: ${returnId}`);

        return updatedReturn;
    }

    /**
     * Complete quality control check
     */
    async completeQC(returnId: string, dto: CompleteQCDto) {
        this.logger.log(`Completing QC for return ${returnId}`);

        const returnRequest = await this.prisma.orderReturn.findUnique({
            where: { return_id: returnId },
            include: { order: true },
        });

        if (!returnRequest) {
            throw new NotFoundException('Return request not found');
        }

        if (returnRequest.return_status !== ReturnStatus.PICKED_UP) {
            throw new BadRequestException(
                'Return must be picked up before QC',
            );
        }

        const newStatus = dto.qc_passed
            ? ReturnStatus.QC_PASSED
            : ReturnStatus.QC_FAILED;

        const updatedReturn = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReturn.update({
                where: { return_id: returnId },
                data: {
                    return_status: newStatus,
                    qc_passed: dto.qc_passed,
                    qc_notes: dto.qc_notes,
                    qc_completed_at: new Date(),
                },
            });

            await tx.order.update({
                where: { order_id: returnRequest.order_id },
                data: {
                    return_status: newStatus,
                },
            });

            return updated;
        });

        this.logger.log(`QC completed for return ${returnId}: ${dto.qc_passed ? 'PASSED' : 'FAILED'}`);

        // If QC passed, automatically initiate refund
        if (dto.qc_passed) {
            try {
                await this.refundService.initiateRefund(
                    returnRequest.order_id,
                    returnRequest.order.user_id,
                    { reason: 'Return approved after QC' },
                );
                this.logger.log(`Refund initiated for return ${returnId}`);
            } catch (error) {
                this.logger.error(`Failed to initiate refund for return ${returnId}`, error);
            }
        }

        return updatedReturn;
    }

    /**
     * Complete return process
     */
    async completeReturn(returnId: string) {
        this.logger.log(`Completing return ${returnId}`);

        const returnRequest = await this.prisma.orderReturn.findUnique({
            where: { return_id: returnId },
            include: { order: true },
        });

        if (!returnRequest) {
            throw new NotFoundException('Return request not found');
        }

        if (returnRequest.return_status !== ReturnStatus.QC_PASSED) {
            throw new BadRequestException(
                'Return must pass QC before completion',
            );
        }

        const updatedReturn = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.orderReturn.update({
                where: { return_id: returnId },
                data: {
                    return_status: ReturnStatus.COMPLETED,
                    completed_at: new Date(),
                },
            });

            await tx.order.update({
                where: { order_id: returnRequest.order_id },
                data: {
                    return_status: ReturnStatus.COMPLETED,
                },
            });

            return updated;
        });

        this.logger.log(`Return completed: ${returnId}`);

        // Emit event
        this.eventEmitter.emit(
            'order.return.completed',
            new OrderReturnCompletedEvent(returnRequest.order, updatedReturn),
        );

        return updatedReturn;
    }

    /**
     * Get return details for an order
     */
    async getReturnDetails(orderId: string) {
        const returnRequest = await this.prisma.orderReturn.findFirst({
            where: { order_id: orderId },
            orderBy: { requested_at: 'desc' },
        });

        if (!returnRequest) {
            throw new NotFoundException('No return found for this order');
        }

        return returnRequest;
    }

    /**
     * Get all returns (admin)
     */
    async getAllReturns(status?: ReturnStatus) {
        return this.prisma.orderReturn.findMany({
            where: status ? { return_status: status } : undefined,
            include: {
                order: {
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
