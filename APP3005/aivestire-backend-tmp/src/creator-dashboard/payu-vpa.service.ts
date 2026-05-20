import axios from 'axios';
import { createHash } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

type PayUValidationResponse = {
  status?: number | string;
  msg?: string;
  message?: string;
  isVPAValid?: boolean | number | string;
  vpa?: string;
  customerName?: string;
  payerAccountName?: string;
  accountHolderName?: string;
  result?: {
    isValidVpa?: boolean | number | string;
    payerAccountName?: string;
    vpa?: string;
  };
};

export interface PayUUpiVerificationResult {
  provider: 'PAYU';
  isValid: boolean;
  upiId: string;
  payerAccountName: string | null;
  rawMessage?: string;
}

@Injectable()
export class PayUVpaService {
  private readonly logger = new Logger(PayUVpaService.name);
  private readonly merchantKey: string;
  private readonly merchantSalt: string;
  private readonly validationUrl: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.merchantKey =
      this.configService.get<string>('PAYU_VPA_KEY')?.trim() ||
      this.configService.get<string>('PAYU_MERCHANT_KEY')?.trim() ||
      this.configService.get<string>('PAYU_KEY')?.trim() ||
      '';
    this.merchantSalt =
      this.configService.get<string>('PAYU_VPA_SALT')?.trim() ||
      this.configService.get<string>('PAYU_MERCHANT_SALT')?.trim() ||
      this.configService.get<string>('PAYU_SALT')?.trim() ||
      '';

    const configuredUrl =
      this.configService.get<string>('PAYU_VPA_VALIDATION_URL')?.trim() || '';
    const configuredEnvironment = (
      this.configService.get<string>('PAYU_VPA_ENV') ||
      this.configService.get<string>('PAYU_ENVIRONMENT') ||
      this.configService.get<string>('PAYU_ENV') ||
      ''
    )
      .trim()
      .toUpperCase();
    const frontendUrl = this.configService.get<string>('FRONTEND_URL')?.trim() ?? '';
    const normalizedFrontendHost = frontendUrl
      ? this.normalizeHost(frontendUrl)
      : '';
    const isProductionEnvironment = configuredEnvironment
      ? ['PRODUCTION', 'PROD', 'LIVE'].includes(configuredEnvironment)
      : normalizedFrontendHost === 'aivestire.com' ||
        normalizedFrontendHost === 'www.aivestire.com';

    this.validationUrl =
      configuredUrl ||
      (isProductionEnvironment
        ? 'https://info.payu.in/merchant/postservice.php'
        : 'https://test.payu.in/merchant/postservice.php');

    this.isConfigured = Boolean(this.merchantKey && this.merchantSalt);

    if (!this.isConfigured) {
      this.logger.warn(
        'PayU VPA credentials are missing; creator UPI verification is disabled. Set PAYU_VPA_KEY/PAYU_VPA_SALT or PAYU_KEY/PAYU_SALT.',
      );
    }

    this.logger.log(
      `PayU VPA verification initialised in ${isProductionEnvironment ? 'PRODUCTION' : 'TEST'} mode`,
    );
  }

  async verifyUpiId(rawUpiId: string): Promise<PayUUpiVerificationResult> {
    const upiId = this.normalizeUpiId(rawUpiId);

    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'PayU UPI verification is not configured. Set PAYU_VPA_KEY/PAYU_VPA_SALT or PAYU_KEY/PAYU_SALT before verifying payout IDs.',
      );
    }

    const payload = new URLSearchParams({
      key: this.merchantKey,
      command: 'validateVPA',
      var1: upiId,
      hash: this.generateValidateVpaHash(upiId),
    });

    try {
      const response = await axios.post<PayUValidationResponse | string>(
        this.withFormQueryParam(this.validationUrl),
        payload.toString(),
        {
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 15000,
        },
      );

      const responseData =
        typeof response.data === 'string'
          ? this.parseJsonResponse(response.data)
          : response.data;
      const normalizedResponse = this.normalizeVerificationResponse(
        responseData,
        upiId,
      );

      if (!normalizedResponse.isValid) {
        throw new BadRequestException(
          normalizedResponse.rawMessage ||
            'The entered UPI ID could not be verified with PayU.',
        );
      }

      return normalizedResponse;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      const responseMessage =
        axios.isAxiosError(error) &&
        error.response?.data &&
        typeof error.response.data === 'object'
          ? this.extractResponseMessage(error.response.data as PayUValidationResponse)
          : undefined;
      const errorMessage =
        responseMessage ||
        (error instanceof Error ? error.message : 'Unknown PayU error');

      this.logger.error(
        `PayU UPI verification failed for ${upiId}: ${errorMessage}`,
      );

      throw new ServiceUnavailableException(
        'Unable to verify the UPI ID with PayU right now. Please try again.',
      );
    }
  }

  private normalizeHost(url: string): string {
    try {
      return new URL(url).hostname.trim().toLowerCase();
    } catch {
      return url.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    }
  }

  private withFormQueryParam(url: string): string {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('form', '2');
      return parsedUrl.toString();
    } catch {
      return url.includes('?') ? `${url}&form=2` : `${url}?form=2`;
    }
  }

  private normalizeUpiId(rawUpiId: string) {
    const normalizedUpiId = rawUpiId.trim().toLowerCase();

    if (!normalizedUpiId) {
      throw new BadRequestException('Enter a UPI ID to verify.');
    }

    if (!UPI_ID_REGEX.test(normalizedUpiId)) {
      throw new BadRequestException(
        'Enter a valid UPI ID like yourname@upi.',
      );
    }

    return normalizedUpiId;
  }

  private generateValidateVpaHash(upiId: string) {
    return createHash('sha512')
      .update(`${this.merchantKey}|validateVPA|${upiId}|${this.merchantSalt}`)
      .digest('hex');
  }

  private parseJsonResponse(rawResponse: string): PayUValidationResponse {
    try {
      return JSON.parse(rawResponse) as PayUValidationResponse;
    } catch {
      throw new ServiceUnavailableException(
        'PayU returned an unreadable response while verifying the UPI ID.',
      );
    }
  }

  private normalizeVerificationResponse(
    response: PayUValidationResponse,
    fallbackUpiId: string,
  ): PayUUpiVerificationResult {
    const resolvedUpiId =
      response.result?.vpa?.trim().toLowerCase() ||
      response.vpa?.trim().toLowerCase() ||
      fallbackUpiId;

    return {
      provider: 'PAYU',
      isValid: this.coerceBoolean(
        response.result?.isValidVpa ?? response.isVPAValid,
      ),
      upiId: resolvedUpiId,
      payerAccountName: this.normalizeAccountName(
        response.result?.payerAccountName ||
          response.payerAccountName ||
          response.customerName ||
          response.accountHolderName,
      ),
      rawMessage: this.extractResponseMessage(response),
    };
  }

  private extractResponseMessage(response: PayUValidationResponse) {
    if (typeof response.message === 'string' && response.message.trim()) {
      return response.message.trim();
    }

    if (typeof response.msg === 'string' && response.msg.trim()) {
      return response.msg.trim();
    }

    return undefined;
  }

  private normalizeAccountName(accountName?: string | null) {
    if (!accountName) {
      return null;
    }

    const trimmedAccountName = accountName.trim();

    if (
      !trimmedAccountName ||
      ['na', 'n/a', 'null', 'undefined'].includes(
        trimmedAccountName.toLowerCase(),
      )
    ) {
      return null;
    }

    return trimmedAccountName;
  }

  private coerceBoolean(value: unknown) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim().toLowerCase();
      return ['1', 'true', 'yes', 'valid', 'success'].includes(
        normalizedValue,
      );
    }

    return false;
  }
}
