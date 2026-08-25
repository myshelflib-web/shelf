import { Request, Response, NextFunction } from "express";

export function internalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secret = process.env.INTERNAL_SECRET;
  if (!secret) {
    next();
    return;
  }

  const header = req.headers["x-internal-secret"];
  if (header !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
