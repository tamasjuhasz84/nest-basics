import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import type { Request, Response } from "express";
import { PinoLogger } from "nestjs-pino";

import { buildSafeReqMeta } from "../logging/redaction";

type RequestWithId = Request & { requestId?: string };

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext("HTTP");
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithId>();
    const res = http.getResponse<Response>();

    const start = Date.now();
    const meta = buildSafeReqMeta(req);

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const statusCode = res.statusCode;
          this.logger.info({ ...meta, statusCode, ms }, "request completed");
        },
        error: (err) => {
          const ms = Date.now() - start;
          const statusCode = err?.status ?? res.statusCode ?? 500;
          const isProd = process.env.NODE_ENV === "production";

          this.logger.error(
            {
              ...meta,
              statusCode,
              ms,
              errorName: err?.name,
              message: isProd ? "Internal server error" : err?.message,
            },
            "request failed",
          );
        },
      }),
    );
  }
}
