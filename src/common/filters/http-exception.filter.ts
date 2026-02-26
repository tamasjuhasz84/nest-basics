import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

type RequestWithId = Request & { requestId?: string };

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<RequestWithId>();

    const timestamp = new Date().toISOString();
    const path = req.originalUrl;
    const requestId = req.requestId ?? req.header("x-request-id");

    // Mongo duplicate key (E11000) -> 409 Conflict
    const anyEx = exception as any;
    if (anyEx?.code === 11000) {
      const keyValue = anyEx?.keyValue as Record<string, unknown> | undefined;
      const fields = keyValue ? Object.keys(keyValue).join(", ") : "unknown";

      return res.status(409).json({
        statusCode: 409,
        error: "Conflict",
        message: `Duplicate key: ${fields}`,
        details: keyValue, // opcionális (lásd lent)
        path,
        timestamp,
        requestId,
      });
    }

    // HttpException (NotFoundException, BadRequestException, ValidationPipe, etc.)
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === "string") {
        return res.status(statusCode).json({
          statusCode,
          error: HttpStatus[statusCode] ?? "Error",
          message: response,
          path,
          timestamp,
          requestId,
        });
      }

      const r = response as any;

      return res.status(statusCode).json({
        statusCode: r.statusCode ?? statusCode,
        error: r.error ?? HttpStatus[statusCode] ?? "Error",
        message: r.message ?? "Error",
        path,
        timestamp,
        requestId,
      });
    }

    // Unknown/unhandled errors → 500
    return res.status(500).json({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Unexpected error",
      path,
      timestamp,
      requestId,
    });
  }
}
