import { Request, Response } from "express";
import { signToken } from "../middleware/auth.js";
import { toPublicUser } from "../utils/publicUser.js";
import { logger } from "../utils/logger.js";
import { enrichLogContext } from "../utils/logContext.js";

export function issueAuthResponse(
  res: Response,
  user: Parameters<typeof toPublicUser>[0],
  options?: {
    status?: number;
    req?: Request;
    authMethod?: string;
  }
) {
  const status = options?.status ?? 200;
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  enrichLogContext({ userId: user.id, userRole: user.role });
  (options?.req?.log ?? logger).info("auth.session.issued", {
    userId: user.id,
    userRole: user.role,
    authMethod: options?.authMethod ?? "unknown",
  });

  res.status(status).json({ user: toPublicUser(user), token });
}
