// src/common/logging/redaction.ts
import type { Request } from "express";

type RequestWithId = Request & { requestId?: string };

const SAFE_HEADER_ALLOWLIST = new Set([
  "accept",
  "content-type",
  "user-agent",
  "x-request-id",
]);

export function pickSafeHeaders(
  headers: Request["headers"],
): Record<string, string> {
  const out: Record<string, string> = {};

  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase();
    if (!SAFE_HEADER_ALLOWLIST.has(key)) continue;

    const value =
      typeof v === "string" ? v : Array.isArray(v) ? v.join(",") : "";

    if (value) out[key] = value;
  }

  return out;
}

export function buildSafeReqMeta(req: RequestWithId) {
  const requestId = req.requestId ?? req.header("x-request-id") ?? "n/a";

  return {
    requestId,
    method: req.method,
    path: req.originalUrl ?? req.url,
    headers: pickSafeHeaders(req.headers),
  };
}
