import { BadRequestException } from '@nestjs/common';
import { TryOnPackPurchaseStatus } from '@prisma/client';
import { TryOnPackPurchasesService } from './try-on-pack-purchases.service';

describe('TryOnPackPurchasesService', () => {
  const createService = () => {
    const purchaseRecord = {
      purchase_id: 'purchase-1',
      user_id: 'user-1',
      plan_id: 'starter',
      pack_name: 'Starter Pack',
      try_ons: 3,
      amount_paise: 4900,
      return_path: '/ai-try-on',
      metadata: {},
      status: TryOnPackPurchaseStatus.CREATED,
      user: {
        user_id: 'user-1',
        email: 'buyer@example.com',
        phone: '9999999999',
        max_try_ons: 3,
        try_ons_used: 3,
      },
    };

    const repository = {
      findUserForPurchase: jest.fn(),
      createPurchase: jest.fn(),
      findPurchaseByTxnId: jest.fn().mockResolvedValue(purchaseRecord),
      capturePurchaseAndCredit: jest.fn().mockResolvedValue({
        alreadyCaptured: false,
      }),
      markPurchaseFailed: jest.fn(),
    };

    const payuGateway = {
      buildCheckoutPayload: jest.fn().mockImplementation((payload) => ({
        ...payload,
        surl: payload.successUrl,
        furl: payload.failureUrl,
      })),
      verifyResponseHash: jest.fn().mockReturnValue(true),
    };

    const configService = {
      get: jest.fn().mockImplementation((key: string, fallback?: string) => {
        if (key === 'FRONTEND_URL') {
          return 'https://aivestire.com';
        }
        return fallback;
      }),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key === 'PAYU_SUCCESS_URL') {
          return 'https://api.aivestire.com/payments/success';
        }
        if (key === 'PAYU_FAILURE_URL') {
          return 'https://api.aivestire.com/payments/failure';
        }
        throw new Error(`Unexpected config key ${key}`);
      }),
    };

    return {
      service: new TryOnPackPurchasesService(
        repository as any,
        payuGateway as any,
        configService as any,
      ),
      repository,
      payuGateway,
      purchaseRecord,
    };
  };

  it('credits purchased try-ons exactly once on successful capture', async () => {
    const { service, repository, purchaseRecord } = createService();

    const result = await service.handlePaymentSuccess({
      txnid: 'TOV_12345678_ABCD',
      hash: 'valid-hash',
      status: 'success',
      mihpayid: 'mihpayid-1',
      amount: '49.00',
      productinfo: 'Starter Pack (3 Try-Ons)',
      firstname: 'buyer',
      email: 'buyer@example.com',
    });

    expect(repository.capturePurchaseAndCredit).toHaveBeenCalledWith({
      purchaseId: purchaseRecord.purchase_id,
      userId: purchaseRecord.user_id,
      tryOns: purchaseRecord.try_ons,
      gatewayPaymentId: 'mihpayid-1',
      metadata: expect.objectContaining({
        verified_at: expect.any(String),
      }),
    });
    expect(result.redirectUrl).toContain('tryOnPurchase=success');
    expect(result.redirectUrl).toContain('tryOnPurchaseTryOns=3');
  });

  it('rejects a success callback when the amount does not match the pack price', async () => {
    const { service, repository } = createService();

    await expect(
      service.handlePaymentSuccess({
        txnid: 'TOV_12345678_ABCD',
        hash: 'valid-hash',
        status: 'success',
        mihpayid: 'mihpayid-1',
        amount: '99.00',
        productinfo: 'Starter Pack (3 Try-Ons)',
        firstname: 'buyer',
        email: 'buyer@example.com',
      }),
    ).rejects.toEqual(new BadRequestException('Payment amount mismatch'));

    expect(repository.capturePurchaseAndCredit).not.toHaveBeenCalled();
  });

  it('does not credit the user again if the callback is replayed after capture', async () => {
    const { service, repository, purchaseRecord } = createService();
    repository.findPurchaseByTxnId.mockResolvedValueOnce({
      ...purchaseRecord,
      status: TryOnPackPurchaseStatus.CAPTURED,
    });

    const result = await service.handlePaymentSuccess({
      txnid: 'TOV_12345678_ABCD',
      hash: 'valid-hash',
      status: 'success',
      mihpayid: 'mihpayid-1',
      amount: '49.00',
      productinfo: 'Starter Pack (3 Try-Ons)',
      firstname: 'buyer',
      email: 'buyer@example.com',
    });

    expect(repository.capturePurchaseAndCredit).not.toHaveBeenCalled();
    expect(result.redirectUrl).toContain('tryOnPurchase=success');
  });

  it('builds local callback URLs from the current web origin when provided', async () => {
    const { service, repository, payuGateway } = createService();
    repository.findUserForPurchase.mockResolvedValue({
      user_id: 'user-1',
      email: 'buyer@example.com',
      phone: '9999999999',
    });
    repository.createPurchase.mockResolvedValue({
      purchase_id: 'purchase-1',
    });

    const payload = await service.initiatePurchase(
      'user-1',
      {
        planId: 'studio',
        returnPath: '/ai-try-on',
      },
      'http://localhost:3005',
    );

    expect(repository.createPurchase).toHaveBeenCalled();
    expect(payuGateway.buildCheckoutPayload).toHaveBeenCalled();
    expect(payload.surl).toBe(
      'http://localhost:3005/api/try-on-pack-purchases/success',
    );
    expect(payload.furl).toBe(
      'http://localhost:3005/api/try-on-pack-purchases/failure',
    );
  });
});
