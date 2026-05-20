import * as common from '@nestjs/common';
import * as express from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  DEFAULT_TRY_ON_PACK_RETURN_PATH,
  TRY_ON_PURCHASE_REASON_PARAM,
  TRY_ON_PURCHASE_RESULT_PARAM,
} from './try-on-pack-purchases.constants';
import {
  InitiateTryOnPackPurchaseDto,
  VerifyTryOnPackPurchaseDto,
} from './dto/try-on-pack-purchases.dto';
import { TryOnPackPurchasesService } from './try-on-pack-purchases.service';

@common.Controller('try-on-pack-purchases')
export class TryOnPackPurchasesController {
  constructor(
    private readonly tryOnPackPurchasesService: TryOnPackPurchasesService,
    private readonly configService: ConfigService,
  ) {}

  @common.Post('initiate')
  @common.UseGuards(JwtAuthGuard)
  @common.HttpCode(common.HttpStatus.CREATED)
  async initiatePurchase(
    @common.Request()
    req: {
      user: { user_id: string };
      headers?: Record<string, string | string[] | undefined>;
    },
    @common.Body() dto: InitiateTryOnPackPurchaseDto,
  ) {
    return this.tryOnPackPurchasesService.initiatePurchase(
      req.user.user_id,
      dto,
      this.resolveCallbackBaseUrl(req.headers),
    );
  }

  @common.Post('dev-skip')
  @common.UseGuards(JwtAuthGuard)
  @common.HttpCode(common.HttpStatus.CREATED)
  async devSkipPurchase(
    @common.Request()
    req: {
      user: { user_id: string };
      headers?: Record<string, string | string[] | undefined>;
    },
    @common.Body() dto: InitiateTryOnPackPurchaseDto,
  ) {
    return this.tryOnPackPurchasesService.devSkipPurchase(
      req.user.user_id,
      dto,
      this.resolveCallbackBaseUrl(req.headers),
    );
  }

  @common.Get('history')
  @common.UseGuards(JwtAuthGuard)
  async getPurchaseHistory(
    @common.Request() req: { user: { user_id: string } },
  ) {
    return this.tryOnPackPurchasesService.getPurchaseHistory(
      req.user.user_id,
    );
  }

  @common.Post('success')
  async paymentSuccess(
    @common.Body() dto: VerifyTryOnPackPurchaseDto,
    @common.Res() res: express.Response,
  ) {
    try {
      const result = await this.tryOnPackPurchasesService.handlePaymentSuccess(
        dto,
      );
      res.redirect(result.redirectUrl);
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Virtual try-on payment verification failed';
      res.redirect(this.buildFailureRedirectUrl(reason));
    }
  }

  @common.Post('failure')
  async paymentFailure(
    @common.Body() dto: VerifyTryOnPackPurchaseDto,
    @common.Res() res: express.Response,
  ) {
    try {
      const result = await this.tryOnPackPurchasesService.handlePaymentFailure(
        dto,
      );
      res.redirect(result.redirectUrl);
    } catch (error) {
      const reason = error instanceof Error
        ? error.message
        : dto.error_Message ?? 'Payment failed';
      res.redirect(this.buildFailureRedirectUrl(reason));
    }
  }

  private buildFailureRedirectUrl(reason: string) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:8080',
    );

    const redirectUrl = new URL(
      DEFAULT_TRY_ON_PACK_RETURN_PATH,
      frontendUrl.endsWith('/') ? frontendUrl : `${frontendUrl}/`,
    );

    redirectUrl.searchParams.set(TRY_ON_PURCHASE_RESULT_PARAM, 'failure');
    redirectUrl.searchParams.set(TRY_ON_PURCHASE_REASON_PARAM, reason);

    return redirectUrl.toString();
  }

  private resolveCallbackBaseUrl(
    headers?: Record<string, string | string[] | undefined>,
  ): string | undefined {
    const originHeader = headers?.origin;
    const refererHeader = headers?.referer;

    const origin =
      typeof originHeader === 'string'
        ? originHeader
        : Array.isArray(originHeader)
          ? originHeader[0]
          : undefined;
    if (origin) {
      return origin;
    }

    const referer =
      typeof refererHeader === 'string'
        ? refererHeader
        : Array.isArray(refererHeader)
          ? refererHeader[0]
          : undefined;
    if (!referer) {
      return undefined;
    }

    try {
      return new URL(referer).origin;
    } catch {
      return undefined;
    }
  }
}
