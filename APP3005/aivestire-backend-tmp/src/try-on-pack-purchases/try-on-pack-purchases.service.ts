import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TryOnPackPurchaseStatus } from '@prisma/client';
import { CreatePayUOrderResponse } from '../payment/dto/payment.dto';
import { PAYU_CONSTANTS } from '../payment/constants/payment.constants';
import { PayUGatewayService } from '../payment/services/payu-gateway.service';
import {
  DEFAULT_TRY_ON_PACK_RETURN_PATH,
  TRY_ON_PACKS,
  TRY_ON_PACK_TXN_PREFIX,
  TRY_ON_PURCHASE_PLAN_PARAM,
  TRY_ON_PURCHASE_REASON_PARAM,
  TRY_ON_PURCHASE_RESULT_PARAM,
  TRY_ON_PURCHASE_TRY_ONS_PARAM,
  type TryOnPackId,
} from './try-on-pack-purchases.constants';
import {
  InitiateTryOnPackPurchaseDto,
  VerifyTryOnPackPurchaseDto,
} from './dto/try-on-pack-purchases.dto';
import { TryOnPackPurchasesRepository } from './try-on-pack-purchases.repository';

@Injectable()
export class TryOnPackPurchasesService {
  private readonly logger = new Logger(TryOnPackPurchasesService.name);

  constructor(
    private readonly repository: TryOnPackPurchasesRepository,
    private readonly payuGateway: PayUGatewayService,
    private readonly configService: ConfigService,
  ) {}

  async initiatePurchase(
    userId: string,
    dto: InitiateTryOnPackPurchaseDto,
    callbackBaseUrl?: string,
  ): Promise<CreatePayUOrderResponse> {
    const user = await this.repository.findUserForPurchase(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const pack = TRY_ON_PACKS[dto.planId as TryOnPackId];
    if (!pack) {
      throw new BadRequestException('Invalid try-on pack selected');
    }

    if (
      pack.priceInr < PAYU_CONSTANTS.MIN_AMOUNT ||
      pack.priceInr > PAYU_CONSTANTS.MAX_AMOUNT
    ) {
      throw new BadRequestException(
        'Try-on pack amount is outside the allowed payment range',
      );
    }

    const txnid = this.generateTxnId();
    const amount = pack.priceInr.toFixed(2);
    const safeReturnPath = this.sanitizeReturnPath(dto.returnPath);

    const purchase = await this.repository.createPurchase({
      userId: user.user_id,
      planId: pack.id,
      packName: pack.name,
      tryOns: pack.tryOns,
      amountPaise: pack.priceInr * 100,
      gatewayTxnId: txnid,
      returnPath: safeReturnPath,
      metadata: {
        initiated_at: new Date().toISOString(),
        user_id: user.user_id,
        plan_id: pack.id,
        try_ons: pack.tryOns,
        return_path: safeReturnPath,
      },
    });

    return this.payuGateway.buildCheckoutPayload({
      txnid,
      amount,
      productinfo: `${pack.name} (${pack.tryOns} Try-Ons)`,
      firstname: user.email.split('@')[0],
      email: user.email,
      phone: user.phone ?? '',
      successUrl: this.buildCallbackUrl('success', callbackBaseUrl),
      failureUrl: this.buildCallbackUrl('failure', callbackBaseUrl),
      udf1: purchase.purchase_id,
      udf2: pack.id,
      udf3: String(pack.tryOns),
    });
  }

  async handlePaymentSuccess(dto: VerifyTryOnPackPurchaseDto) {
    this.verifyResponseHash(dto);

    if (dto.status.toLowerCase() !== 'success') {
      throw new BadRequestException('Payment status is not success');
    }

    const purchase = await this.repository.findPurchaseByTxnId(dto.txnid);
    if (!purchase) {
      throw new NotFoundException('Try-on pack purchase not found');
    }

    this.assertAmountMatchesPurchase(dto.amount, purchase.amount_paise);

    if (purchase.status === TryOnPackPurchaseStatus.CAPTURED) {
      return {
        redirectUrl: this.buildFrontendRedirectUrl(
          purchase.return_path,
          'success',
          {
            tryOns: purchase.try_ons,
            plan: purchase.plan_id,
          },
        ),
      };
    }

    const captureResult = await this.repository.capturePurchaseAndCredit({
      purchaseId: purchase.purchase_id,
      userId: purchase.user_id,
      tryOns: purchase.try_ons,
      gatewayPaymentId: dto.mihpayid,
      metadata: {
        ...(this.asMetadata(purchase.metadata)),
        payu_response: {
          mihpayid: dto.mihpayid,
          status: dto.status,
          txnid: dto.txnid,
        },
        verified_at: new Date().toISOString(),
      },
    });

    if (!captureResult.alreadyCaptured) {
      this.logger.log(
        `Credited ${purchase.try_ons} try-ons for user ${purchase.user_id} via purchase ${purchase.purchase_id}`,
      );
    }

    return {
      redirectUrl: this.buildFrontendRedirectUrl(
        purchase.return_path,
        'success',
        {
          tryOns: purchase.try_ons,
          plan: purchase.plan_id,
        },
      ),
    };
  }

  async handlePaymentFailure(dto: VerifyTryOnPackPurchaseDto) {
    this.verifyResponseHash(dto);

    const purchase = await this.repository.findPurchaseByTxnId(dto.txnid);
    if (!purchase) {
      throw new NotFoundException('Try-on pack purchase not found');
    }

    if (purchase.status === TryOnPackPurchaseStatus.CAPTURED) {
      return {
        redirectUrl: this.buildFrontendRedirectUrl(
          purchase.return_path,
          'success',
          {
            tryOns: purchase.try_ons,
            plan: purchase.plan_id,
          },
        ),
      };
    }

    await this.repository.markPurchaseFailed({
      purchaseId: purchase.purchase_id,
      metadata: {
        ...(this.asMetadata(purchase.metadata)),
        failure: {
          code: dto.error_code ?? 'UNKNOWN',
          description: dto.error_Message ?? 'Payment failed',
        },
        failed_at: new Date().toISOString(),
      },
    });

    return {
      redirectUrl: this.buildFrontendRedirectUrl(
        purchase.return_path,
        'failure',
        {
          reason: dto.error_Message ?? 'Payment failed',
        },
      ),
    };
  }

  private verifyResponseHash(dto: VerifyTryOnPackPurchaseDto) {
    const isHashValid = this.payuGateway.verifyResponseHash(
      {
        txnid: dto.txnid,
        amount: dto.amount,
        productinfo: dto.productinfo,
        firstname: dto.firstname,
        email: dto.email,
        status: dto.status,
        additional_charges: dto.additional_charges ?? dto.additionalCharges,
        splitInfo: dto.splitInfo,
        udf1: dto.udf1,
        udf2: dto.udf2,
        udf3: dto.udf3,
        udf4: dto.udf4,
        udf5: dto.udf5,
      },
      dto.hash,
    );

    if (!isHashValid) {
      throw new BadRequestException('Payment signature verification failed');
    }
  }

  private assertAmountMatchesPurchase(amount: string, amountPaise: number) {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount)) {
      throw new BadRequestException('Invalid payment amount received');
    }

    if (Math.round(parsedAmount * 100) !== amountPaise) {
      throw new BadRequestException('Payment amount mismatch');
    }
  }

  private buildCallbackUrl(
    type: 'success' | 'failure',
    callbackBaseUrl?: string,
  ): string {
    const configuredUrl = this.configService
      .get<string>(
        type === 'success'
          ? 'PAYU_TRY_ON_SUCCESS_URL'
          : 'PAYU_TRY_ON_FAILURE_URL',
      )
      ?.trim();

    if (configuredUrl) {
      return configuredUrl;
    }

    const requestScopedUrl = this.buildCallbackUrlFromBase(
      callbackBaseUrl,
      type,
    );
    if (requestScopedUrl) {
      return requestScopedUrl;
    }

    const fallback = this.configService.getOrThrow<string>(
      type === 'success' ? 'PAYU_SUCCESS_URL' : 'PAYU_FAILURE_URL',
    );

    try {
      const url = new URL(fallback);
      const replacedPath = url.pathname.replace(
        /\/payments\/(success|failure)\/?$/,
        `/try-on-pack-purchases/${type}`,
      );
      url.pathname =
        replacedPath === url.pathname
          ? `/try-on-pack-purchases/${type}`
          : replacedPath;
      return url.toString();
    } catch {
      const replacedUrl = fallback.replace(
        /\/payments\/(success|failure)\/?$/,
        `/try-on-pack-purchases/${type}`,
      );

      return replacedUrl === fallback
        ? `${fallback.replace(/\/$/, '')}/try-on-pack-purchases/${type}`
        : replacedUrl;
    }
  }

  private buildCallbackUrlFromBase(
    baseUrl: string | undefined,
    type: 'success' | 'failure',
  ): string | null {
    if (!baseUrl) {
      return null;
    }

    try {
      const origin = new URL(baseUrl);
      const callbackUrl = new URL(
        `/api/try-on-pack-purchases/${type}`,
        origin.origin.endsWith('/') ? origin.origin : `${origin.origin}/`,
      );
      return callbackUrl.toString();
    } catch {
      return null;
    }
  }

  private buildFrontendRedirectUrl(
    returnPath: string | null | undefined,
    status: 'success' | 'failure',
    options?: {
      plan?: string;
      tryOns?: number;
      reason?: string;
    },
  ) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:8080',
    );

    const redirectUrl = new URL(
      this.sanitizeReturnPath(returnPath),
      frontendUrl.endsWith('/') ? frontendUrl : `${frontendUrl}/`,
    );

    redirectUrl.searchParams.set(TRY_ON_PURCHASE_RESULT_PARAM, status);

    if (typeof options?.tryOns === 'number') {
      redirectUrl.searchParams.set(
        TRY_ON_PURCHASE_TRY_ONS_PARAM,
        String(options.tryOns),
      );
    }

    if (options?.plan) {
      redirectUrl.searchParams.set(TRY_ON_PURCHASE_PLAN_PARAM, options.plan);
    }

    if (options?.reason) {
      redirectUrl.searchParams.set(TRY_ON_PURCHASE_REASON_PARAM, options.reason);
    }

    return redirectUrl.toString();
  }

  private sanitizeReturnPath(returnPath?: string | null) {
    if (
      !returnPath ||
      !returnPath.startsWith('/') ||
      returnPath.startsWith('//')
    ) {
      return DEFAULT_TRY_ON_PACK_RETURN_PATH;
    }

    return returnPath;
  }

  private asMetadata(
    metadata: unknown,
  ): Record<string, unknown> {
    return metadata && typeof metadata === 'object'
      ? (metadata as Record<string, unknown>)
      : {};
  }

  private generateTxnId() {
    const timestamp = Date.now().toString().slice(-8);
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${TRY_ON_PACK_TXN_PREFIX}${timestamp}_${randomSuffix}`;
  }
}
