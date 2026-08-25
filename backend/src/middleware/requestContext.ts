import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger.js";
import { metrics } from "../utils/metrics.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      log?: ReturnType<typeof logger.child>;
    }
  }
}

export function requestContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId =
    (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  req.log = logger.child({
    requestId,
    method: req.method,
    path: req.path,
  });

  const start = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.path;

    metrics.inc("http_requests_total", {
      method: req.method,
      status: res.statusCode,
    });
    metrics.observe("http_request_duration_ms", durationMs, {
      method: req.method,
      status: res.statusCode,
    });

    const level =
      res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    req.log![level]("http.request", {
      status: res.statusCode,
      durationMs,
      route,
    });
  });

  next();
}
