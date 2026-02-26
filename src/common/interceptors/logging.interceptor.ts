import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import type { Request, Response } from "express";

type RequestWithId = Request & { requestId?: string };

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithId>();
    const res = http.getResponse<Response>();

    const start = Date.now();

    const requestId = req.requestId ?? req.header("x-request-id") ?? "n/a";
    const method = req.method;
    const path = req.originalUrl ?? req.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const statusCode = res.statusCode;

          this.logger.log(
            JSON.stringify({ requestId, method, path, statusCode, ms }),
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          const statusCode = err?.status ?? res.statusCode ?? 500;

          this.logger.error(
            JSON.stringify({
              requestId,
              method,
              path,
              statusCode,
              ms,
              message: err?.message,
            }),
          );
        },
      }),
    );
  }
}
