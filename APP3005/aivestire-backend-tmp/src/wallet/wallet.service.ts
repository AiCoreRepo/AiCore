// ============================================
// WALLET SERVICE
// ============================================

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { WalletRepository } from './wallet.repository';
import { CreditWalletDto } from './dto/credit-wallet.dto';
import { DebitWalletDto } from './dto/debit-wallet.dto';
import { AdminCreditDto } from './dto/admin-credit.dto';
import {
    WalletTransactionType,
    WalletTransactionSource,
    WalletTransactionStatus,
} from '@prisma/client';
import {
    addMoney,
    deductMoney,
    validateBalance,
    safeAmountCalculation,
} from './utils/wallet-math.utils';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(private readonly walletRepo: WalletRepository) { }

    // Get or create wallet for user
    async getOrCreateWallet(userId: string) {
        let wallet = await this.walletRepo.findByUserId(userId);
        if (!wallet) {
            this.logger.log(`Creating wallet for user ${userId}`);
            wallet = await this.walletRepo.create(userId);
        }
        return wallet;
    }

    // Get wallet balance
    async getBalance(userId: string) {
        const wallet = await this.getOrCreateWallet(userId);
        return {
            walletId: wallet.wallet_id,
            balance: wallet.balance,
            updatedAt: wallet.updated_at,
        };
    }

    // Credit money to wallet
    async creditWallet(userId: string, dto: CreditWalletDto) {
        const safeAmount = safeAmountCalculation(dto.amount);
        const wallet = await this.getOrCreateWallet(userId);
        const newBalance = addMoney(wallet.balance, safeAmount);

        this.logger.log(
            `Crediting ₹${safeAmount} to wallet ${wallet.wallet_id} | ` +
            `Old: ₹${wallet.balance} → New: ₹${newBalance}`,
        );

        const result = await this.walletRepo.creditBalance(
            wallet.wallet_id,
            newBalance,
            {
                wallet: { connect: { wallet_id: wallet.wallet_id } },
                type: WalletTransactionType.CREDIT,
                source: dto.source,
                amount: safeAmount,
                reference_id: dto.referenceId,
                description: dto.description,
                status: WalletTransactionStatus.SUCCESS,
            },
        );

        return {
            wallet: result.wallet,
            transaction: result.transaction,
            message: `₹${safeAmount} credited successfully`,
        };
    }

    // Debit money from wallet (checkout)
    async debitWallet(userId: string, dto: DebitWalletDto) {
        const safeAmount = safeAmountCalculation(dto.amount);
        const wallet = await this.getOrCreateWallet(userId);

        // Validate sufficient balance
        if (!validateBalance(wallet.balance, safeAmount)) {
            throw new BadRequestException(
                `Insufficient wallet balance. Available: ₹${wallet.balance}, Requested: ₹${safeAmount}`,
            );
        }

        const newBalance = deductMoney(wallet.balance, safeAmount);

        this.logger.log(
            `Debiting ₹${safeAmount} from wallet ${wallet.wallet_id} | ` +
            `Old: ₹${wallet.balance} → New: ₹${newBalance}`,
        );

        const result = await this.walletRepo.debitBalance(
            wallet.wallet_id,
            newBalance,
            {
                wallet: { connect: { wallet_id: wallet.wallet_id } },
                type: WalletTransactionType.DEBIT,
                source: WalletTransactionSource.ORDER_PAYMENT,
                amount: safeAmount,
                reference_id: dto.referenceId,
                description: dto.description || 'Order payment deduction',
                status: WalletTransactionStatus.SUCCESS,
            },
        );

        return {
            wallet: result.wallet,
            transaction: result.transaction,
            message: `₹${safeAmount} debited successfully`,
        };
    }

    // Admin credit wallet for any user
    async adminCreditWallet(dto: AdminCreditDto) {
        const safeAmount = safeAmountCalculation(dto.amount);
        const wallet = await this.getOrCreateWallet(dto.userId);
        const newBalance = addMoney(wallet.balance, safeAmount);

        this.logger.log(
            `Admin crediting ₹${safeAmount} to user ${dto.userId} wallet`,
        );

        const result = await this.walletRepo.creditBalance(
            wallet.wallet_id,
            newBalance,
            {
                wallet: { connect: { wallet_id: wallet.wallet_id } },
                type: WalletTransactionType.CREDIT,
                source: WalletTransactionSource.ADMIN_CREDIT,
                amount: safeAmount,
                description: dto.description || 'Admin wallet credit',
                status: WalletTransactionStatus.SUCCESS,
            },
        );

        return {
            wallet: result.wallet,
            transaction: result.transaction,
            message: `₹${safeAmount} credited to user wallet`,
        };
    }

    // Get paginated transaction history
    async getTransactions(userId: string, page = 1, limit = 10) {
        const wallet = await this.getOrCreateWallet(userId);
        return this.walletRepo.getTransactions(wallet.wallet_id, page, limit);
    }
}
