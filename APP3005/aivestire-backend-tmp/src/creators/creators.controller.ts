import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @Patch('accept-terms')
  async acceptTerms(@CurrentUser('user_id') userId: string) {
    const creator = await this.creatorsService.getCreatorByUserId(userId);
    return this.creatorsService.acceptTerms(creator.creator_id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @Get('terms-status')
  async getTermsStatus(@CurrentUser('user_id') userId: string) {
    const creator = await this.creatorsService.getCreatorByUserId(userId);
    return this.creatorsService.getTermsStatus(creator.creator_id);
  }
}
