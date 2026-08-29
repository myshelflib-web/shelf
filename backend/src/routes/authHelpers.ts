import { Response } from "express";
import { signToken } from "../middleware/auth.js";
import { toPublicUser } from "../utils/publicUser.js";

export function issueAuthResponse(
  res: Response,
  user: Parameters<typeof toPublicUser>[0],
  status = 200
) {
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(status).json({ user: toPublicUser(user), token });
}
