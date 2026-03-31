// ============================================
// PAYU GATEWAY SERVICE
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PAYU_CONSTANTS } from '../constants/payment.constants';

// ─── Public types ────────────────────────────────────────────────────────────

export interface PayUHashParams {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PayUResponseHashParams extends PayUHashParams {
  status: string;
}

export interface PayUCheckoutPayload {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  action: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Handles all PayU-specific cryptographic operations.
 *
 * Forward hash formula (for initiating payment):
 *   SHA512( key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|||||||||SALT )
 *
 * Reverse hash formula (for response verification):
 *   SHA512( SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key )
 */
@Injectable()
export class PayUGatewayService {
  private readonly logger = new Logger(PayUGatewayService.name);
  private readonly key: string;
  private readonly salt: string;
  private readonly payuBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.key = this.configService.getOrThrow<string>('PAYU_KEY');
    this.salt = this.configService.getOrThrow<string>('PAYU_SALT');

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production' || 
      this.configService.get<string>('PAYU_ENV') === 'production';
    this.payuBaseUrl = isProduction
      ? PAYU_CONSTANTS.PROD_URL
      : PAYU_CONSTANTS.TEST_URL;

    this.logger.log(
      `PayU gateway initialised in ${isProduction ? 'PRODUCTION' : 'TEST'} mode`,
    );
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  getKey(): string {
    return this.key;
  }

  getPayUUrl(): string {
    return this.payuBaseUrl;
  }

  /**
   * Generates the SHA-512 forward hash required when initiating a PayU transaction.
   */
  generateHash(params: PayUHashParams): string {
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = '',
    } = params;

    // PayU hash formula:
    // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|SALT)
    // udf6–udf10 are always empty but MUST be present in the hash string
    const hashString = [
      this.key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1,
      udf2,
      udf3,
      udf4,
      udf5,
      '', // udf6
      '', // udf7
      '', // udf8
      '', // udf9
      '', // udf10
      this.salt,
    ].join('|');

    const hash = crypto.createHash('sha512').update(hashString).digest('hex');
    this.logger.debug(`Forward hash generated for txnid: ${txnid}`);
    return hash;
  }

  /**
   * Verifies the hash received in PayU's postback (reverse hash).
   * This is the SECURITY-CRITICAL step — never mark a payment as successful without this.
   */
  verifyResponseHash(
    params: PayUResponseHashParams,
    receivedHash: string,
  ): boolean {
    try {
      const {
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        status,
        udf1 = '',
        udf2 = '',
        udf3 = '',
        udf4 = '',
        udf5 = '',
      } = params;

      const reverseHashString = [
        this.salt,
        status,
        '',
        '',
        '',
        '',
        '',
        udf5,
        udf4,
        udf3,
        udf2,
        udf1,
        email,
        firstname,
        productinfo,
        amount,
        txnid,
        this.key,
      ].join('|');

      const expectedHash = crypto
        .createHash('sha512')
        .update(reverseHashString)
        .digest('hex');

      const expectedBuf = Buffer.from(expectedHash, 'hex');
      const receivedBuf = Buffer.from(receivedHash, 'hex');

      // Length check prevents timing-safe-equal from throwing on mismatched lengths
      if (expectedBuf.length !== receivedBuf.length) {
        this.logger.warn(`Hash length mismatch for txnid: ${txnid}`);
        return false;
      }

      const isValid = crypto.timingSafeEqual(expectedBuf, receivedBuf);
      this.logger.log(
        `PayU response hash for txnid ${txnid}: ${isValid ? 'VALID' : 'INVALID'}`,
      );
      return isValid;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Hash verification error: ${msg}`);
      return false;
    }
  }

  /**
   * Builds the complete checkout payload to send to the frontend.
   * Hash is computed here — the frontend never computes or touches the hash.
   */
  buildCheckoutPayload(params: {
    txnid: string;
    amount: string;
    productinfo: string;
    firstname: string;
    email: string;
    phone: string;
    successUrl: string;
    failureUrl: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  }): PayUCheckoutPayload {
    const hash = this.generateHash({
      txnid: params.txnid,
      amount: params.amount,
      productinfo: params.productinfo,
      firstname: params.firstname,
      email: params.email,
      udf1: params.udf1,
      udf2: params.udf2,
      udf3: params.udf3,
      udf4: params.udf4,
      udf5: params.udf5,
    });

    return {
      key: this.key,
      txnid: params.txnid,
      amount: params.amount,
      productinfo: params.productinfo,
      firstname: params.firstname,
      email: params.email,
      phone: params.phone,
      surl: params.successUrl,
      furl: params.failureUrl,
      hash,
      action: this.payuBaseUrl,
      udf1: params.udf1,
      udf2: params.udf2,
      udf3: params.udf3,
      udf4: params.udf4,
      udf5: params.udf5,
    };
  }
}
