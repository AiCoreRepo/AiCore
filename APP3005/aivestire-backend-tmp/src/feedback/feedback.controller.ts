import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FeedbackContextType } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminJwtGuard } from '../auth/admin/guards/admin-jwt.guard';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async submitFeedback(
    @CurrentUser('user_id') userId: string,
    @Body() dto: SubmitFeedbackDto,
  ) {
    return this.feedbackService.submitFeedback(userId, dto);
  }

  @Get('admin')
  @UseGuards(AdminJwtGuard)
  async getAdminFeedback(
    @Query('context') contextType?: FeedbackContextType,
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 50;
    const parsedMinRating = minRating ? Number.parseInt(minRating, 10) : undefined;
    const parsedMaxRating = maxRating ? Number.parseInt(maxRating, 10) : undefined;

    return this.feedbackService.getAdminFeedback(
      contextType,
      parsedMinRating,
      parsedMaxRating,
      Number.isNaN(parsedLimit) ? 50 : parsedLimit,
    );
  }
}
