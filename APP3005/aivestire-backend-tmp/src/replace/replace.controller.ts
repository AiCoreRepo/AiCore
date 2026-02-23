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
import { ReplacementService } from './replace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestReplacementDto } from './dto/request-replacement.dto';
import { SchedulePickupDto } from '../return/dto/schedule-pickup.dto';
import { ReplacementStatus } from '@prisma/client';

@Controller('replacements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReplacementController {
  constructor(private readonly replacementService: ReplacementService) { }

  /**
   * Request replacement for delivered order
   * POST /replacements/:orderId
   */
  @Post(':orderId')
  async requestReplacement(
    @Param('orderId') orderId: string,
    @Body() dto: RequestReplacementDto,
    @Req() req: any,
  ) {
    return this.replacementService.requestReplacement(
      orderId,
      req.user.user_id,
      dto,
    );
  }

  /**
   * Get replacement details for order
   * GET /replacements/order/:orderId
   */
  @Get('order/:orderId')
  async getReplacementDetails(@Param('orderId') orderId: string) {
    return this.replacementService.getReplacementDetails(orderId);
  }

  /**
   * Admin: Get all replacements
   * GET /replacements?status=REQUESTED
   */
  @Get()
  @Roles('ADMIN')
  async getAllReplacements(@Query('status') status?: ReplacementStatus) {
    return this.replacementService.getAllReplacements(status);
  }

  /**
   * Admin: Approve replacement
   * POST /replacements/:replacementId/approve
   */
  @Post(':replacementId/approve')
  @Roles('ADMIN')
  async approveReplacement(
    @Param('replacementId') replacementId: string,
    @Req() req: any,
  ) {
    return this.replacementService.approveReplacement(
      replacementId,
      req.user.user_id,
    );
  }

  /**
   * Admin: Reject replacement
   * POST /replacements/:replacementId/reject
   */
  @Post(':replacementId/reject')
  @Roles('ADMIN')
  async rejectReplacement(
    @Param('replacementId') replacementId: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.replacementService.rejectReplacement(
      replacementId,
      req.user.user_id,
      reason,
    );
  }

  /**
   * Admin: Schedule pickup for original item
   * POST /replacements/:replacementId/schedule-pickup
   */
  @Post(':replacementId/schedule-pickup')
  @Roles('ADMIN')
  async schedulePickup(
    @Param('replacementId') replacementId: string,
    @Body() dto: SchedulePickupDto,
  ) {
    return this.replacementService.schedulePickup(replacementId, dto);
  }

  /**
   * Logistics: Mark original item as picked up
   * POST /replacements/:replacementId/mark-picked-up
   */
  @Post(':replacementId/mark-picked-up')
  @Roles('ADMIN')
  async markPickedUp(@Param('replacementId') replacementId: string) {
    return this.replacementService.markPickedUp(replacementId);
  }

  /**
   * Admin: Dispatch replacement item
   * POST /replacements/:replacementId/dispatch
   */
  @Post(':replacementId/dispatch')
  @Roles('ADMIN')
  async markDispatched(
    @Param('replacementId') replacementId: string,
    @Body('trackingNumber') trackingNumber: string,
  ) {
    return this.replacementService.markDispatched(
      replacementId,
      trackingNumber,
    );
  }

  /**
   * Logistics: Mark replacement as delivered
   * POST /replacements/:replacementId/mark-delivered
   */
  @Post(':replacementId/mark-delivered')
  @Roles('ADMIN')
  async markDelivered(@Param('replacementId') replacementId: string) {
    return this.replacementService.markDelivered(replacementId);
  }

  /**
   * Admin: Complete replacement
   * POST /replacements/:replacementId/complete
   */
  @Post(':replacementId/complete')
  @Roles('ADMIN')
  async completeReplacement(@Param('replacementId') replacementId: string) {
    return this.replacementService.completeReplacement(replacementId);
  }
}
