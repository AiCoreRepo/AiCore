import {
    Controller,
    Post,
    Get,
    Param,
    Body,
    UseGuards,
    Req,
    Query,
} from '@nestjs/common';
import { RefundService } from './refund.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestRefundDto } from './dto/request-refund.dto';
import { RefundStatus } from '@prisma/client';

@Controller('refunds')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RefundController {
    constructor(private readonly refundService: RefundService) { }

    /**
     * Request refund for cancelled order
     * POST /refunds/:orderId
     */
    @Post(':orderId')
    async requestRefund(
        @Param('orderId') orderId: string,
        @Body() dto: RequestRefundDto,
        @Req() req: any,
    ) {
        return this.refundService.initiateRefund(orderId, req.user.userId, dto);
    }

    /**
     * Get refund status for order
     * GET /refunds/order/:orderId
     */
    @Get('order/:orderId')
    async getRefundStatus(@Param('orderId') orderId: string) {
        return this.refundService.getRefundStatus(orderId);
    }

    /**
     * Admin: Get all refunds
     * GET /refunds?status=INITIATED
     */
    @Get()
    @Roles('ADMIN')
    async getAllRefunds(@Query('status') status?: RefundStatus) {
        return this.refundService.getAllRefunds(status);
    }

    /**
     * Admin: Process refund
     * POST /refunds/:refundId/process
     */
    @Post(':refundId/process')
    @Roles('ADMIN')
    async processRefund(@Param('refundId') refundId: string, @Req() req: any) {
        return this.refundService.processRefund(refundId, req.user.userId);
    }

    /**
     * Admin: Complete refund
     * POST /refunds/:refundId/complete
     */
    @Post(':refundId/complete')
    @Roles('ADMIN')
    async completeRefund(
        @Param('refundId') refundId: string,
        @Body('transactionId') transactionId: string,
        @Req() req: any,
    ) {
        return this.refundService.completeRefund(
            refundId,
            req.user.userId,
            transactionId,
        );
    }

    /**
     * Admin: Reject refund
     * POST /refunds/:refundId/reject
     */
    @Post(':refundId/reject')
    @Roles('ADMIN')
    async rejectRefund(
        @Param('refundId') refundId: string,
        @Body('reason') reason: string,
        @Req() req: any,
    ) {
        return this.refundService.rejectRefund(refundId, req.user.userId, reason);
    }
}
