import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.header("x-request-id");
    const requestId = incoming && incoming.trim() ? incoming : randomUUID();

    // attach to req for later usage
    (req as any).requestId = requestId;

    // echo back for clients
    res.setHeader("x-request-id", requestId);
    next();
  }
}
