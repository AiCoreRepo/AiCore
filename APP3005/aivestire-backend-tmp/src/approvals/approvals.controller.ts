import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post(':productId/approve')
  approve(
    @Param('productId') productId: string,
    @CurrentUser() admin: { user_id: string },
    @Body('comment') comment?: string,
  ) {
    return this.approvalsService.approve(productId, admin.user_id, comment);
  }

  @Post(':productId/reject')
  reject(
    @Param('productId') productId: string,
    @CurrentUser() admin: { user_id: string },
    @Body('comment') comment?: string,
  ) {
    return this.approvalsService.reject(productId, admin.user_id, comment);
  }
}
