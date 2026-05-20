import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TryOnPackPurchaseStatus } from '@prisma/client';
import { TryOnPackPurchasesService } from './try-on-pack-purchases.service';

describe('TryOnPackPurchasesService', () => {
  const createService = (
    configOverrides: Record<string, string | undefined> = {},
  ) => {
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
      listPurchasesForUser: jest.fn(),
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
        if (Object.prototype.hasOwnProperty.call(configOverrides, key)) {
          return configOverrides[key];
        }
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

  it('returns purchase history in newest-first API shape', async () => {
    const { service, repository } = createService();
    const createdAt = new Date('2026-05-17T12:00:00.000Z');
    const creditedAt = new Date('2026-05-17T12:03:00.000Z');

    repository.listPurchasesForUser.mockResolvedValue([
      {
        purchase_id: 'purchase-1',
        plan_id: 'studio',
        pack_name: 'Studio Pack',
        try_ons: 12,
        amount_paise: 14900,
        currency: 'INR',
        status: TryOnPackPurchaseStatus.CAPTURED,
        payment_method: 'PAYU',
        credited_at: creditedAt,
        created_at: createdAt,
      },
    ]);

    const result = await service.getPurchaseHistory('user-1');

    expect(repository.listPurchasesForUser).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([
      {
        purchaseId: 'purchase-1',
        planId: 'studio',
        packName: 'Studio Pack',
        tryOns: 12,
        amountPaise: 14900,
        currency: 'INR',
        status: TryOnPackPurchaseStatus.CAPTURED,
        paymentMethod: 'PAYU',
        creditedAt,
        createdAt,
      },
    ]);
  });

  it('credits selected try-ons without PayU in dev/test environments', async () => {
    const { service, repository } = createService({
      FRONTEND_URL: 'https://dev.aivestire.com',
      PAYU_ENV: 'test',
    });
    const createdAt = new Date('2026-05-18T12:00:00.000Z');
    const creditedAt = new Date('2026-05-18T12:01:00.000Z');
    const createdPurchase = {
      purchase_id: 'purchase-dev',
      user_id: 'user-1',
      plan_id: 'studio',
      pack_name: 'Studio Pack',
      try_ons: 12,
      amount_paise: 14900,
      currency: 'INR',
      payment_method: null,
      credited_at: null,
      created_at: createdAt,
      metadata: {},
      status: TryOnPackPurchaseStatus.CREATED,
    };

    repository.findUserForPurchase.mockResolvedValue({
      user_id: 'user-1',
      email: 'buyer@example.com',
      phone: '9999999999',
    });
    repository.createPurchase.mockResolvedValue(createdPurchase);
    repository.capturePurchaseAndCredit.mockResolvedValue({
      alreadyCaptured: false,
      purchase: {
        ...createdPurchase,
        status: TryOnPackPurchaseStatus.CAPTURED,
        payment_method: 'DEV_SKIP',
        credited_at: creditedAt,
      },
    });

    const result = await service.devSkipPurchase(
      'user-1',
      {
        planId: 'studio',
        returnPath: '/ai-try-on',
      },
      'https://dev.aivestire.com',
    );

    expect(repository.createPurchase).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        planId: 'studio',
        gatewayTxnId: expect.stringMatching(/^TOV_DEV_/),
      }),
    );
    expect(repository.capturePurchaseAndCredit).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseId: 'purchase-dev',
        userId: 'user-1',
        tryOns: 12,
        paymentMethod: 'DEV_SKIP',
      }),
    );
    expect(result).toEqual({
      success: true,
      tryOns: 12,
      planId: 'studio',
      purchase: expect.objectContaining({
        purchaseId: 'purchase-dev',
        status: TryOnPackPurchaseStatus.CAPTURED,
        paymentMethod: 'DEV_SKIP',
        creditedAt,
      }),
    });
  });

  it('rejects dev payment skip in production payment environments', async () => {
    const { service, repository } = createService({
      FRONTEND_URL: 'https://aivestire.com',
      PAYU_ENV: 'production',
    });

    await expect(
      service.devSkipPurchase(
        'user-1',
        {
          planId: 'starter',
          returnPath: '/ai-try-on',
        },
        'https://aivestire.com',
      ),
    ).rejects.toEqual(
      new ForbiddenException(
        'Dev payment skip is only available in dev/test environments',
      ),
    );

    expect(repository.createPurchase).not.toHaveBeenCalled();
    expect(repository.capturePurchaseAndCredit).not.toHaveBeenCalled();
  });
});
