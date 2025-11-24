import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

  async approve(productId: string, adminUserId: string, comment?: string) {
    return this.prisma.$transaction(async (tx) => {
      const approval = await tx.productApproval.findFirst({
        where: { product_id: productId, status: 'pending' },
      });
      if (!approval) throw new NotFoundException('No pending approval found');

      await tx.productApproval.update({
        where: { approval_id: approval.approval_id },
        data: {
          status: 'approved',
          admin_user_id: adminUserId,
          actioned_at: new Date(),
          comment,
        },
      });

      await tx.product.update({
        where: { product_id: productId },
        data: { status: 'approved' },
      });

      await tx.approvalLog.create({
        data: {
          approval_id: approval.approval_id,
          actor_user_id: adminUserId,
          action: 'approved',
          comment,
        },
      });

      return { message: 'Product approved' };
    });
  }

  async reject(productId: string, adminUserId: string, comment?: string) {
    return this.prisma.$transaction(async (tx) => {
      const approval = await tx.productApproval.findFirst({
        where: { product_id: productId, status: 'pending' },
      });
      if (!approval) throw new NotFoundException('No pending approval found');

      await tx.productApproval.update({
        where: { approval_id: approval.approval_id },
        data: {
          status: 'rejected',
          admin_user_id: adminUserId,
          actioned_at: new Date(),
          comment,
        },
      });

      await tx.product.update({
        where: { product_id: productId },
        data: { status: 'rejected' },
      });

      await tx.approvalLog.create({
        data: {
          approval_id: approval.approval_id,
          actor_user_id: adminUserId,
          action: 'rejected',
          comment,
        },
      });

      return { message: 'Product rejected' };
    });
  }
}
