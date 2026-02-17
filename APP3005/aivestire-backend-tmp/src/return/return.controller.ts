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
import { ReturnService } from './return.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestReturnDto } from './dto/request-return.dto';
import { SchedulePickupDto } from './dto/schedule-pickup.dto';
import { CompleteQCDto } from './dto/complete-qc.dto';
import { ReturnStatus } from '@prisma/client';

@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnController {
    constructor(private readonly returnService: ReturnService) { }

    /**
     * Request return for delivered order
     * POST /returns/:orderId
     */
    @Post(':orderId')
    async requestReturn(
        @Param('orderId') orderId: string,
        @Body() dto: RequestReturnDto,
        @Req() req: any,
    ) {
        return this.returnService.requestReturn(orderId, req.user.userId, dto);
    }

    /**
     * Get return details for order
     * GET /returns/order/:orderId
     */
    @Get('order/:orderId')
    async getReturnDetails(@Param('orderId') orderId: string) {
        return this.returnService.getReturnDetails(orderId);
    }

    /**
     * Admin: Get all returns
     * GET /returns?status=REQUESTED
     */
    @Get()
    @Roles('ADMIN')
    async getAllReturns(@Query('status') status?: ReturnStatus) {
        return this.returnService.getAllReturns(status);
    }

    /**
     * Admin: Approve return
     * POST /returns/:returnId/approve
     */
    @Post(':returnId/approve')
    @Roles('ADMIN')
    async approveReturn(@Param('returnId') returnId: string, @Req() req: any) {
        return this.returnService.approveReturn(returnId, req.user.userId);
    }

    /**
     * Admin: Reject return
     * POST /returns/:returnId/reject
     */
    @Post(':returnId/reject')
    @Roles('ADMIN')
    async rejectReturn(
        @Param('returnId') returnId: string,
        @Body('reason') reason: string,
        @Req() req: any,
    ) {
        return this.returnService.rejectReturn(returnId, req.user.userId, reason);
    }

    /**
     * Admin: Schedule pickup
     * POST /returns/:returnId/schedule-pickup
     */
    @Post(':returnId/schedule-pickup')
    @Roles('ADMIN')
    async schedulePickup(
        @Param('returnId') returnId: string,
        @Body() dto: SchedulePickupDto,
    ) {
        return this.returnService.schedulePickup(returnId, dto);
    }

    /**
     * Logistics: Mark as picked up
     * POST /returns/:returnId/mark-picked-up
     */
    @Post(':returnId/mark-picked-up')
    @Roles('ADMIN')
    async markPickedUp(@Param('returnId') returnId: string) {
        return this.returnService.markPickedUp(returnId);
    }

    /**
     * Admin: Complete QC
     * POST /returns/:returnId/qc
     */
    @Post(':returnId/qc')
    @Roles('ADMIN')
    async completeQC(
        @Param('returnId') returnId: string,
        @Body() dto: CompleteQCDto,
    ) {
        return this.returnService.completeQC(returnId, dto);
    }

    /**
     * Admin: Complete return
     * POST /returns/:returnId/complete
     */
    @Post(':returnId/complete')
    @Roles('ADMIN')
    async completeReturn(@Param('returnId') returnId: string) {
        return this.returnService.completeReturn(returnId);
    }
}
