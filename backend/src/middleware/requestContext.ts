import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger.js";
import { metrics } from "../utils/metrics.js";
import {
  activeTraceFields,
  enrichLogContext,
  runWithLogContext,
} from "../utils/logContext.js";
import { clientIpFromRequest } from "../utils/logRedact.js";
import { httpRouteGroup, httpStatusClass } from "../utils/appMetrics.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      log?: ReturnType<typeof logger.child>;
    }
  }
}

function traceResponseHeaders(res: Response): void {
  const { traceId } = activeTraceFields();
  if (traceId) {
    res.setHeader("x-trace-id", traceId);
  }
}

export function requestContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId =
    (req.headers["x-request-id"] as string | undefined)?.trim() || randomUUID();
  const clientIp = clientIpFromRequest(
    req.headers as unknown as Record<string, unknown>
  );
  const userAgent =
    typeof req.headers["user-agent"] === "string"
      ? req.headers["user-agent"].slice(0, 160)
      : undefined;

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  traceResponseHeaders(res);

  runWithLogContext(
    {
      requestId,
      method: req.method,
      path: req.path,
      clientIp,
    },
    () => {
      req.log = logger.child({
        requestId,
        method: req.method,
        path: req.path,
      });

      req.log.debug("http.request.start", {
        clientIp,
        userAgent,
        contentLength: req.headers["content-length"] ?? null,
      });

      const start = Date.now();
      res.on("finish", () => {
        const durationMs = Date.now() - start;
        const route = req.route?.path
          ? `${req.baseUrl}${req.route.path}`
          : req.path;
        enrichLogContext({ route });

        metrics.inc("http_requests_total", {
          method: req.method,
          status: res.statusCode,
          route_group: httpRouteGroup(req.path),
          status_class: httpStatusClass(res.statusCode),
        });
        metrics.observe("http_request_duration_ms", durationMs, {
          method: req.method,
          status: res.statusCode,
          route_group: httpRouteGroup(req.path),
          status_class: httpStatusClass(res.statusCode),
        });

        const level =
          res.statusCode >= 500
            ? "error"
            : res.statusCode >= 400
              ? "warn"
              : "info";

        req.log![level]("http.request", {
          status: res.statusCode,
          durationMs,
          route,
          clientIp,
        });
      });

      next();
    }
  );
}
