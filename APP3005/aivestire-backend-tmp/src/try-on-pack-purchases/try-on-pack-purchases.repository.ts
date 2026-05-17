import { Injectable } from '@nestjs/common';
import {
  PaymentGateway,
  Prisma,
  TryOnPackPurchaseStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface CreateTryOnPackPurchaseInput {
  userId: string;
  planId: string;
  packName: string;
  tryOns: number;
  amountPaise: number;
  gatewayTxnId: string;
  returnPath?: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class TryOnPackPurchasesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserForPurchase(userId: string) {
    return this.prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        email: true,
        phone: true,
        max_try_ons: true,
        try_ons_used: true,
      },
    });
  }

  async createPurchase(input: CreateTryOnPackPurchaseInput) {
    return this.prisma.tryOnPackPurchase.create({
      data: {
        user_id: input.userId,
        plan_id: input.planId,
        pack_name: input.packName,
        try_ons: input.tryOns,
        amount_paise: input.amountPaise,
        currency: 'INR',
        gateway: PaymentGateway.PAYU,
        gateway_order_id: input.gatewayTxnId,
        return_path: input.returnPath,
        status: TryOnPackPurchaseStatus.CREATED,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async findPurchaseByTxnId(gatewayTxnId: string) {
    return this.prisma.tryOnPackPurchase.findFirst({
      where: { gateway_order_id: gatewayTxnId },
      include: {
        user: {
          select: {
            user_id: true,
            email: true,
            phone: true,
            max_try_ons: true,
            try_ons_used: true,
          },
        },
      },
    });
  }

  async capturePurchaseAndCredit(input: {
    purchaseId: string;
    userId: string;
    tryOns: number;
    gatewayPaymentId: string;
    paymentMethod?: string;
    metadata: Record<string, unknown>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const existingPurchase = await tx.tryOnPackPurchase.findUniqueOrThrow({
        where: { purchase_id: input.purchaseId },
      });

      if (existingPurchase.status === TryOnPackPurchaseStatus.CAPTURED) {
        const existingUser = await tx.user.findUniqueOrThrow({
          where: { user_id: input.userId },
          select: {
            user_id: true,
            max_try_ons: true,
            try_ons_used: true,
          },
        });

        return {
          alreadyCaptured: true,
          purchase: existingPurchase,
          user: existingUser,
        };
      }

      const captureResult = await tx.tryOnPackPurchase.updateMany({
        where: {
          purchase_id: input.purchaseId,
          status: {
            not: TryOnPackPurchaseStatus.CAPTURED,
          },
        },
        data: {
          gateway_payment_id: input.gatewayPaymentId,
          payment_method: input.paymentMethod,
          status: TryOnPackPurchaseStatus.CAPTURED,
          credited_at: new Date(),
          metadata: input.metadata as Prisma.InputJsonValue,
        },
      });

      if (captureResult.count === 0) {
        const [capturedPurchase, existingUser] = await Promise.all([
          tx.tryOnPackPurchase.findUniqueOrThrow({
            where: { purchase_id: input.purchaseId },
          }),
          tx.user.findUniqueOrThrow({
            where: { user_id: input.userId },
            select: {
              user_id: true,
              max_try_ons: true,
              try_ons_used: true,
            },
          }),
        ]);

        return {
          alreadyCaptured: true,
          purchase: capturedPurchase,
          user: existingUser,
        };
      }

      const updatedUser = await tx.user.update({
        where: { user_id: input.userId },
        data: {
          max_try_ons: {
            increment: input.tryOns,
          },
        },
        select: {
          user_id: true,
          max_try_ons: true,
          try_ons_used: true,
        },
      });

      const updatedPurchase = await tx.tryOnPackPurchase.findUniqueOrThrow({
        where: { purchase_id: input.purchaseId },
      });

      return {
        alreadyCaptured: false,
        purchase: updatedPurchase,
        user: updatedUser,
      };
    });
  }

  async markPurchaseFailed(input: {
    purchaseId: string;
    paymentMethod?: string;
    metadata: Record<string, unknown>;
  }) {
    return this.prisma.tryOnPackPurchase.update({
      where: { purchase_id: input.purchaseId },
      data: {
        payment_method: input.paymentMethod,
        status: TryOnPackPurchaseStatus.FAILED,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  }
}
