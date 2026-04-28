import axios from 'axios';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PayUVpaService } from './payu-vpa.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PayUVpaService', () => {
  const createConfigService = (overrides?: Record<string, string | undefined>) =>
    ({
      get: jest.fn((key: string) => {
        const values: Record<string, string | undefined> = {
          PAYU_MERCHANT_KEY: 'merchantKey123',
          PAYU_MERCHANT_SALT: 'merchantSalt123',
          PAYU_VPA_VALIDATION_URL:
            'https://test.payu.in/merchant/postservice.php',
          ...overrides,
        };

        return values[key];
      }),
    }) as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies a UPI ID and returns the PayU account holder name', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        message: 'Success',
        status: 1,
        result: {
          isValidVpa: true,
          payerAccountName: 'Test User',
          vpa: 'TeStUser@upi',
        },
      },
    });

    const service = new PayUVpaService(createConfigService());

    await expect(service.verifyUpiId('TeStUser@upi')).resolves.toEqual({
      provider: 'PAYU',
      isValid: true,
      upiId: 'testuser@upi',
      payerAccountName: 'Test User',
      rawMessage: 'Success',
    });

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    const [url, requestBody] = mockedAxios.post.mock.calls[0];
    const params = new URLSearchParams(requestBody as string);
    const expectedHash = createHash('sha512')
      .update('merchantKey123|validateVPA|testuser@upi|merchantSalt123')
      .digest('hex');

    expect(url).toBe('https://test.payu.in/merchant/postservice.php');
    expect(params.get('form')).toBe('2');
    expect(params.get('command')).toBe('validateVPA');
    expect(params.get('var1')).toBe('testuser@upi');
    expect(params.get('hash')).toBe(expectedHash);
  });

  it('throws when PayU marks the UPI ID as invalid', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        msg: 'Invalid VPA',
        status: 0,
        isVPAValid: false,
      },
    });

    const service = new PayUVpaService(createConfigService());

    await expect(service.verifyUpiId('invalid@upi')).rejects.toThrow(
      'Invalid VPA',
    );
  });

  it('throws when PayU credentials are not configured', async () => {
    const service = new PayUVpaService(
      createConfigService({
        PAYU_MERCHANT_KEY: undefined,
        PAYU_MERCHANT_SALT: undefined,
      }),
    );

    await expect(service.verifyUpiId('creator@upi')).rejects.toThrow(
      'PayU UPI verification is not configured.',
    );
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('accepts PAYU_KEY and PAYU_SALT aliases', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        message: 'Success',
        status: 1,
        result: {
          isValidVpa: true,
          payerAccountName: 'Alias User',
          vpa: 'alias@upi',
        },
      },
    });

    const service = new PayUVpaService(
      createConfigService({
        PAYU_MERCHANT_KEY: undefined,
        PAYU_MERCHANT_SALT: undefined,
        PAYU_KEY: 'aliasKey123',
        PAYU_SALT: 'aliasSalt123',
      }),
    );

    await expect(service.verifyUpiId('alias@upi')).resolves.toEqual({
      provider: 'PAYU',
      isValid: true,
      upiId: 'alias@upi',
      payerAccountName: 'Alias User',
      rawMessage: 'Success',
    });

    const [, requestBody] = mockedAxios.post.mock.calls[0];
    const params = new URLSearchParams(requestBody as string);
    const expectedHash = createHash('sha512')
      .update('aliasKey123|validateVPA|alias@upi|aliasSalt123')
      .digest('hex');

    expect(params.get('hash')).toBe(expectedHash);
  });
});
