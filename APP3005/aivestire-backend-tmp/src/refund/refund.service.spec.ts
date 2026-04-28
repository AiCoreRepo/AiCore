import { BadRequestException } from '@nestjs/common';
import {
  Prisma,
  RefundStatus,
  WalletTransactionSource,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';
import { RefundService } from './refund.service';

describe('RefundService', () => {
  const createService = () => {
    const updatedRefund = {
      refund_id: 'refund-1',
      order_id: 'order-1',
      amount: new Prisma.Decimal(1499),
      refund_status: RefundStatus.COMPLETED,
      transaction_id: 'txn-wallet-1',
      completed_at: new Date('2026-03-28T10:00:00.000Z'),
    };

    const refundRecord = {
      refund_id: 'refund-1',
      order_id: 'order-1',
      amount: new Prisma.Decimal(1499),
      refund_status: RefundStatus.PROCESSING,
      order: {
        order_id: 'order-1',
        user_id: 'user-1',
        order_number: 'AV-1001',
      },
    };

    const tx = {
      wallet: {
        upsert: jest
          .fn()
          .mockResolvedValue({
            wallet_id: 'wallet-1',
            balance: new Prisma.Decimal(500),
          }),
        update: jest.fn().mockResolvedValue({
          wallet_id: 'wallet-1',
          balance: new Prisma.Decimal(1999),
        }),
      },
      walletTransaction: {
        create: jest.fn().mockResolvedValue({ transaction_id: 'wallet-tx-1' }),
      },
      orderRefund: {
        update: jest.fn().mockResolvedValue(updatedRefund),
      },
      order: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const prisma = {
      orderRefund: {
        findUnique: jest.fn().mockResolvedValue(refundRecord),
      },
      $transaction: jest.fn().mockImplementation(async (callback: any) =>
        callback(tx),
      ),
    };

    const eventEmitter = {
      emit: jest.fn(),
    };

    return {
      service: new RefundService(prisma as any, eventEmitter as any),
      prisma,
      tx,
      refundRecord,
      updatedRefund,
      eventEmitter,
    };
  };

  it('credits the wallet when a refund is completed', async () => {
    const { service, tx, refundRecord, updatedRefund, eventEmitter } =
      createService();

    const result = await service.completeRefund(
      refundRecord.refund_id,
      'admin-1',
      'txn-wallet-1',
    );

    expect(tx.wallet.upsert).toHaveBeenCalledWith({
      where: { user_id: refundRecord.order.user_id },
      update: {},
      create: {
        user_id: refundRecord.order.user_id,
        balance: new Prisma.Decimal(0),
      },
    });

    expect(tx.wallet.update).toHaveBeenCalledWith({
      where: { wallet_id: 'wallet-1' },
      data: {
        balance: new Prisma.Decimal(1999),
      },
    });

    expect(tx.walletTransaction.create).toHaveBeenCalledWith({
      data: {
        wallet_id: 'wallet-1',
        type: WalletTransactionType.CREDIT,
        source: WalletTransactionSource.REFUND,
        amount: refundRecord.amount,
        reference_id: refundRecord.refund_id,
        description: 'Refund credited to wallet for order AV-1001',
        status: WalletTransactionStatus.SUCCESS,
      },
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'order.refund.completed',
      expect.anything(),
    );
    expect(result).toEqual(updatedRefund);
  });

  it('rejects duplicate refund completion attempts', async () => {
    const { service, prisma } = createService();
    prisma.orderRefund.findUnique.mockResolvedValueOnce({
      refund_id: 'refund-1',
      refund_status: RefundStatus.COMPLETED,
      order: {
        order_id: 'order-1',
        user_id: 'user-1',
        order_number: 'AV-1001',
      },
    });

    await expect(
      service.completeRefund('refund-1', 'admin-1', 'txn-wallet-1'),
    ).rejects.toEqual(new BadRequestException('Refund already completed'));
  });
});
