import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, FeedbackContextType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async submitFeedback(userId: string, dto: SubmitFeedbackDto) {
    if (dto.rating <= 3 && !dto.comment?.trim()) {
      throw new BadRequestException(
        'Please share a comment when rating is 3 stars or below.',
      );
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        user_id: userId,
        context_type: dto.context_type,
        context_reference_id: dto.context_reference_id,
        context_label: dto.context_label,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
        metadata: dto.metadata || Prisma.DbNull,
      },
    });

    return {
      feedback_id: feedback.feedback_id,
      message: 'Feedback submitted successfully',
      created_at: feedback.created_at,
      rating: feedback.rating,
    };
  }

  async getAdminFeedback(
    contextType?: FeedbackContextType,
    minRating?: number,
    maxRating?: number,
    limit = 50,
  ) {
    const where: Prisma.FeedbackWhereInput = {};

    if (contextType) {
      where.context_type = contextType;
    }

    if (Number.isInteger(minRating) || Number.isInteger(maxRating)) {
      where.rating = {};
      if (Number.isInteger(minRating)) {
        where.rating.gte = minRating;
      }
      if (Number.isInteger(maxRating)) {
        where.rating.lte = maxRating;
      }
    }

    const normalizedLimit = Math.max(1, Math.min(200, limit || 50));

    const feedbackRows = await this.prisma.feedback.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: normalizedLimit,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    return feedbackRows.map((row) => ({
      feedback_id: row.feedback_id,
      user_id: row.user_id,
      user_email: row.user?.email,
      user_role: row.user?.role,
      rating: row.rating,
      comment: row.comment,
      context_type: row.context_type,
      context_reference_id: row.context_reference_id,
      context_label: row.context_label,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }
}
