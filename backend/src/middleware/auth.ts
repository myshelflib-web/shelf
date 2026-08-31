import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { enrichLogContext } from "../utils/logContext.js";
import { logger } from "../utils/logger.js";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

function attachUserContext(req: Request, user: AuthPayload): void {
  enrichLogContext({ userId: user.userId, userRole: user.role });
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const log = req.log ?? logger;
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    log.warn("auth.denied", { reason: "missing_bearer" });
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    attachUserContext(req, req.user);
    log.debug("auth.ok", { userRole: req.user.role });
    next();
  } catch {
    log.warn("auth.denied", { reason: "invalid_token" });
    res.status(401).json({ error: "Invalid token" });
  }
}

/** Attach req.user when a valid Bearer token is present; otherwise continue as guest. */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const log = req.log ?? logger;
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    attachUserContext(req, req.user);
    log.debug("auth.optional_ok", { userRole: req.user.role });
  } catch {
    log.debug("auth.optional_guest", { reason: "invalid_token" });
  }
  next();
}

export function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const log = req.log ?? logger;
  if (req.user?.role !== "ADMIN") {
    log.warn("auth.admin_denied", { userRole: req.user?.role ?? null });
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
