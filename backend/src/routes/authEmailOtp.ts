import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma.js";
import {
  assertDeliverableEmail,
  createAndSendOtp,
  InvalidEmailError,
  normalizeEmail,
  OtpCooldownError,
  OtpInvalidError,
  OtpRateLimitError,
  sendEmailInBackground,
  verifyOtp,
  welcomeEmail,
} from "../services/email/index.js";
import { userSelect } from "../utils/publicUser.js";
import { issueAuthResponse } from "./authHelpers.js";

const router = Router();

function jsonOtpSendError(res: Response, err: unknown): boolean {
  if (err instanceof InvalidEmailError) {
    res.status(400).json({ error: err.message });
    return true;
  }
  if (err instanceof OtpCooldownError) {
    res.setHeader("Retry-After", String(err.retryAfterSec));
    res.status(429).json({
      error: err.message,
      retryAfterSec: err.retryAfterSec,
    });
    return true;
  }
  if (err instanceof OtpRateLimitError) {
    res.status(429).json({ error: err.message });
    return true;
  }
  return false;
}

router.post("/register/send-otp", async (req: Request, res: Response) => {
  const { email, name } = req.body as { email?: string; name?: string };
  if (!email) {
    res.status(400).json({ error: "Email required" });
    return;
  }

  let normalized: string;
  try {
    normalized = await assertDeliverableEmail(email);
  } catch (err) {
    if (jsonOtpSendError(res, err)) return;
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  try {
    await createAndSendOtp({
      email: normalized,
      purpose: "SIGNUP",
      name: name?.trim(),
    });
    res.json({ ok: true, message: "Verification code sent" });
  } catch (err) {
    if (jsonOtpSendError(res, err)) return;
    throw err;
  }
});

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name, otp } = req.body as {
    email?: string;
    password?: string;
    name?: string;
    otp?: string;
  };
  if (!email || !password || !name || !otp) {
    res.status(400).json({
      error: "Email, password, name, and verification code required",
    });
    return;
  }

  const normalized = normalizeEmail(email);
  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  try {
    await verifyOtp({ email: normalized, purpose: "SIGNUP", code: otp });
  } catch (err) {
    if (err instanceof OtpInvalidError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email: normalized, passwordHash, name: name.trim() },
    select: userSelect,
  });

  sendEmailInBackground({
    to: user.email,
    ...welcomeEmail(user.name),
  });

  issueAuthResponse(res, user, 201);
});

router.post("/forgot-password/send-otp", async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "Email required" });
    return;
  }

  let normalized: string;
  try {
    normalized = await assertDeliverableEmail(email);
  } catch (err) {
    if (jsonOtpSendError(res, err)) return;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { name: true, passwordHash: true },
  });

  // Always respond the same — do not reveal whether the account exists.
  // Cooldown / rate-limit are swallowed for the same reason.
  if (user?.passwordHash) {
    try {
      await createAndSendOtp({
        email: normalized,
        purpose: "PASSWORD_RESET",
        name: user.name,
      });
    } catch (err) {
      if (err instanceof OtpCooldownError || err instanceof OtpRateLimitError) {
        res.json({
          ok: true,
          message: "If an account exists with that email, a reset code has been sent",
        });
        return;
      }
      throw err;
    }
  }

  res.json({
    ok: true,
    message: "If an account exists with that email, a reset code has been sent",
  });
});

router.post("/forgot-password/reset", async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body as {
    email?: string;
    otp?: string;
    newPassword?: string;
  };
  if (!email || !otp || !newPassword) {
    res.status(400).json({ error: "Email, verification code, and new password required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    res.status(400).json({ error: "Invalid or expired verification code" });
    return;
  }

  try {
    await verifyOtp({ email: normalized, purpose: "PASSWORD_RESET", code: otp });
  } catch (err) {
    if (err instanceof OtpInvalidError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });

  res.json({ ok: true, message: "Password updated" });
});

export default router;
