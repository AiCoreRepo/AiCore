import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException ? exception.getResponse() : exception;

    // Log the full error for debugging
    this.logger.error(`❌ Exception on ${request.method} ${request.url}:`);
    this.logger.error(`   Status: ${status}`);
    if (exception instanceof Error) {
      this.logger.error(`   Message: ${exception.message}`);
      this.logger.error(`   Stack: ${exception.stack}`);
    } else {
      this.logger.error(`   Exception: ${JSON.stringify(exception)}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}

