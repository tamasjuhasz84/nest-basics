import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = req.originalUrl;

    // HttpException (NotFoundException, BadRequestException, ValidationPipe, etc.)
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();

      // Nest built-in: string | object (often { statusCode, message, error })
      if (typeof response === "string") {
        return res.status(statusCode).json({
          statusCode,
          error: HttpStatus[statusCode] ?? "Error",
          message: response,
          path,
          timestamp,
        });
      }

      const r = response as any;

      return res.status(statusCode).json({
        statusCode: r.statusCode ?? statusCode,
        error: r.error ?? HttpStatus[statusCode] ?? "Error",
        message: r.message ?? "Error",
        path,
        timestamp,
      });
    }

    // Unknown/unhandled errors → 500
    return res.status(500).json({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Unexpected error",
      path,
      timestamp,
    });
  }
}
