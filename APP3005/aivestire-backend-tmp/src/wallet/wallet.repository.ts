// ============================================
// WALLET REPOSITORY
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WalletRepository {
    constructor(private readonly prisma: PrismaService) { }

    // Find wallet by user ID
    async findByUserId(userId: string) {
        return this.prisma.wallet.findUnique({
            where: { user_id: userId },
        });
    }

    // Create new wallet for user
    async create(userId: string) {
        return this.prisma.wallet.create({
            data: { user_id: userId, balance: 0 },
        });
    }

    // Atomic credit: update balance + create transaction in one DB transaction
    async creditBalance(
        walletId: string,
        newBalance: Prisma.Decimal,
        transactionData: Prisma.WalletTransactionCreateInput,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.update({
                where: { wallet_id: walletId },
                data: { balance: newBalance },
            });

            const transaction = await tx.walletTransaction.create({
                data: transactionData,
            });

            return { wallet, transaction };
        });
    }

    // Atomic debit: update balance + create transaction in one DB transaction
    async debitBalance(
        walletId: string,
        newBalance: Prisma.Decimal,
        transactionData: Prisma.WalletTransactionCreateInput,
    ) {
        return this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.update({
                where: { wallet_id: walletId },
                data: { balance: newBalance },
            });

            const transaction = await tx.walletTransaction.create({
                data: transactionData,
            });

            return { wallet, transaction };
        });
    }

    // Get paginated transaction history
    async getTransactions(
        walletId: string,
        page: number,
        limit: number,
    ) {
        const skip = (page - 1) * limit;

        const [transactions, total] = await this.prisma.$transaction([
            this.prisma.walletTransaction.findMany({
                where: { wallet_id: walletId },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.walletTransaction.count({
                where: { wallet_id: walletId },
            }),
        ]);

        return {
            transactions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
