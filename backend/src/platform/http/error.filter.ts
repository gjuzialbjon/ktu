import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

/** The one error shape every endpoint returns, so the app handles failures in one place. */
export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}

const CODES: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  429: 'rate_limited',
};

@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly log = new Logger('http');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const given = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
      const payload: ApiError = {
        error: {
          code: typeof given.code === 'string' ? given.code : (CODES[status] ?? 'error'),
          message: typeof given.message === 'string' ? given.message : exception.message,
          ...(given.details !== undefined ? { details: given.details } : {}),
        },
      };
      res.status(status).json(payload);
      return;
    }
    // anything else is a bug: log it with its stack, tell the client nothing internal
    this.log.error(exception instanceof Error ? exception.stack : String(exception));
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: { code: 'internal', message: 'Something went wrong on our side.' } } satisfies ApiError);
  }
}
