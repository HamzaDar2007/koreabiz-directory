import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.getCodeFromStatus(status);
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        code = (exceptionResponse as any).code || this.getCodeFromStatus(status);
        details = (exceptionResponse as any).details;
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      code = 'DATABASE_ERROR';
      message = 'Database operation failed';

      // Handle specific database errors
      if (exception.message.includes('duplicate key')) {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_ENTRY';
        message = 'Resource already exists';
      } else if (exception.message.includes('foreign key')) {
        code = 'INVALID_REFERENCE';
        message = 'Referenced resource does not exist';
      }
    } else if (exception instanceof Error) {
      if (exception.name === 'PayloadTooLargeError' || exception.message === 'request entity too large') {
        status = HttpStatus.PAYLOAD_TOO_LARGE;
        code = 'PAYLOAD_TOO_LARGE';
        message = 'Request payload exceeds limit';
      } else {
        message = exception.message;
      }
    }

    // Log error for monitoring
    const errorLog = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      status,
      code,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
    };

    if (status >= 500) {
      this.logger.error('Internal server error', errorLog);
    } else {
      this.logger.warn('Client error', errorLog);
    }

    const errorResponse: any = {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      },
    };

    if (details) {
      errorResponse.error.details = details;
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      errorResponse.error.message = 'Internal server error';
    }

    response.status(status).json(errorResponse);
  }

  private getCodeFromStatus(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'VALIDATION_ERROR';
      case 429: return 'TOO_MANY_REQUESTS';
      default: return 'INTERNAL_ERROR';
    }
  }
}