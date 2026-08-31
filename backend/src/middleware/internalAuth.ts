import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export function internalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const log = req.log ?? logger;
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) {
    log.warn("internal.auth_skipped", {
      reason: "INTERNAL_SECRET unset",
    });
    next();
    return;
  }

  const header = req.headers["x-internal-secret"];
  if (header !== secret) {
    log.warn("internal.denied", { reason: "bad_secret" });
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  log.debug("internal.auth_ok");
  next();
}
