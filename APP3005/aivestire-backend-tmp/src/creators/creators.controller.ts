import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreatorsService } from './creators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { SaveCreatorAddressDto } from './dto/creator-address.dto';

@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  // ─── Admin: Verify creator ──────────────────────────────────────────────────

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

  // ─── Terms ──────────────────────────────────────────────────────────────────

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

  // ─── Address ─────────────────────────────────────────────────────────────────

  /**
   * POST /creators/address
   * Save or update the creator's business address (idempotent upsert).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @Post('address')
  @HttpCode(HttpStatus.OK)
  async saveAddress(
    @CurrentUser('user_id') userId: string,
    @Body() dto: SaveCreatorAddressDto,
  ) {
    const creator = await this.creatorsService.getCreatorByUserId(userId);
    return this.creatorsService.saveCreatorAddress(creator.creator_id, dto);
  }

  /**
   * GET /creators/address
   * Fetch the creator's business address (null if not yet saved).
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CREATOR)
  @Get('address')
  async getAddress(@CurrentUser('user_id') userId: string) {
    const creator = await this.creatorsService.getCreatorByUserId(userId);
    const address = await this.creatorsService.getCreatorAddress(
      creator.creator_id,
    );
    return address ?? null;
  }
}
