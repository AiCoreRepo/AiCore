import { HttpException, HttpStatus } from '@nestjs/common';
import { TryOnErrorCode } from '../enums/ai-provider.enum';

/**
 * Base exception for all try-on related errors
 */
export class TryOnException extends HttpException {
    constructor(
        public readonly errorCode: TryOnErrorCode,
        message: string,
        statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
        public readonly details?: any,
    ) {
        super(
            {
                errorCode,
                message,
                details,
                timestamp: new Date().toISOString(),
            },
            statusCode,
        );
    }
}

/**
 * Image validation errors (400 Bad Request)
 */
export class ImageValidationException extends TryOnException {
    constructor(errorCode: TryOnErrorCode, message: string, details?: any) {
        super(errorCode, message, HttpStatus.BAD_REQUEST, details);
    }
}

/**
 * AI service authentication errors (401 Unauthorized)
 */
export class AIAuthenticationException extends TryOnException {
    constructor(message: string, details?: any) {
        super(
            TryOnErrorCode.AUTHENTICATION_FAILED,
            message,
            HttpStatus.UNAUTHORIZED,
            details,
        );
    }
}

/**
 * Rate limiting errors (429 Too Many Requests)
 */
export class RateLimitException extends TryOnException {
    constructor(message: string, retryAfter?: number) {
        super(
            TryOnErrorCode.RATE_LIMIT_EXCEEDED,
            message,
            HttpStatus.TOO_MANY_REQUESTS,
            { retryAfter },
        );
    }
}

/**
 * AI service errors (500-504)
 */
export class AIServiceException extends TryOnException {
    constructor(
        errorCode: TryOnErrorCode,
        message: string,
        statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
        details?: any,
    ) {
        super(errorCode, message, statusCode, details);
    }
}

/**
 * Configuration errors
 */
export class ConfigurationException extends TryOnException {
    constructor(message: string, details?: any) {
        super(
            TryOnErrorCode.MISSING_CONFIGURATION,
            message,
            HttpStatus.INTERNAL_SERVER_ERROR,
            details,
        );
    }
}

/**
 * Timeout errors (504 Gateway Timeout)
 */
export class TimeoutException extends TryOnException {
    constructor(message: string, details?: any) {
        super(
            TryOnErrorCode.TIMEOUT_ERROR,
            message,
            HttpStatus.GATEWAY_TIMEOUT,
            details,
        );
    }
}

/**
 * Service unavailable errors (503)
 */
export class ServiceUnavailableException extends TryOnException {
    constructor(message: string, details?: any) {
        super(
            TryOnErrorCode.SERVICE_UNAVAILABLE,
            message,
            HttpStatus.SERVICE_UNAVAILABLE,
            details,
        );
    }
}
