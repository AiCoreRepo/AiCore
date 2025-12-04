import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':creatorId/verify')
  async verify(
    @Param('creatorId') creatorId: string,
    @CurrentUser() admin: { user_id: string },
    @Body() verification_data?: any,
  ) {
    return this.creatorsService.verifyCreator(
      creatorId,
      admin.user_id,
      verification_data,
    );
  }
}
