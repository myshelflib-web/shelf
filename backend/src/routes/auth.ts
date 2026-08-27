import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import prisma from "../utils/prisma.js";
import { signToken, authMiddleware } from "../middleware/auth.js";
import { verifyGoogleToken } from "../services/googleAuth.js";
import {
  TelegramAuthError,
} from "../services/telegramAuth.js";
import { authenticateTelegramLogin } from "../services/telegramLogin.js";
import { uploadToS3, getObjectBuffer } from "../services/s3.js";
import { losslessCompressBuffer } from "../utils/losslessCompress.js";
import {
  createAndSendOtp,
  normalizeEmail,
  OtpInvalidError,
  OtpRateLimitError,
  sendEmailInBackground,
  verifyOtp,
  welcomeEmail,
} from "../services/email/index.js";
import { isStudyGoal } from "../studyGoal.js";
import { toPublicUser, userSelect } from "../utils/publicUser.js";
import { toUserFacingError } from "../utils/userFacingError.js";
import { QuotaError, assertStorageRoom } from "../utils/quotas.js";
import { param } from "../utils/param.js";

const router = Router();
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

function issueAuthResponse(
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

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

router.post("/register/send-otp", async (req: Request, res: Response) => {
  const { email, name } = req.body as { email?: string; name?: string };
  if (!email) {
    res.status(400).json({ error: "Email required" });
    return;
  }

  const normalized = normalizeEmail(email);
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
    if (err instanceof OtpRateLimitError) {
      res.status(429).json({ error: err.message });
      return;
    }
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

  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { name: true, passwordHash: true },
  });

  // Always respond the same — do not reveal whether the account exists.
  if (user?.passwordHash) {
    try {
      await createAndSendOtp({
        email: normalized,
        purpose: "PASSWORD_RESET",
        name: user.name,
      });
    } catch (err) {
      if (err instanceof OtpRateLimitError) {
        res.status(429).json({ error: err.message });
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

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  try {
    const stored = await prisma.user.findUnique({
      where: { email },
      select: userSelect,
    });
    if (
      !stored?.passwordHash ||
      !(await bcrypt.compare(password, stored.passwordHash))
    ) {
      res.status(401).json({
        error: stored && !stored.passwordHash
          ? "This account uses Google sign-in"
          : "Invalid credentials",
      });
      return;
    }

    issueAuthResponse(res, stored);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("Can't reach database server")) {
      res.status(503).json({
        error:
          "Database is not running. Start Postgres with docker compose up -d postgres, then try again.",
      });
      return;
    }
    throw err;
  }
});

router.post("/google", async (req: Request, res: Response) => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400).json({ error: "Google credential required" });
    return;
  }

  try {
    const profile = await verifyGoogleToken(credential);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.googleId }, { email: profile.email }],
      },
    });

    if (existing) {
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          googleId: existing.googleId ?? profile.googleId,
          name: existing.name || profile.name,
          avatarUrl: existing.avatarUrl?.startsWith("users/")
            ? existing.avatarUrl
            : profile.avatarUrl,
        },
        select: userSelect,
      });
      issueAuthResponse(res, user);
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: profile.email,
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
      select: userSelect,
    });

    sendEmailInBackground({
      to: user.email,
      ...welcomeEmail(user.name),
    });

    issueAuthResponse(res, user, 201);
  } catch (err) {
    const message = toUserFacingError(
      err instanceof Error ? err.message : "Google authentication failed",
      "Google sign-in failed"
    );
    res.status(401).json({ error: message });
  }
});

router.post("/telegram", async (req: Request, res: Response) => {
  try {
    await authenticateTelegramLogin(
      res,
      (req.body ?? {}) as Record<string, unknown>
    );
  } catch (err) {
    if (err instanceof TelegramAuthError) {
      res.status(err.status).json({
        error: toUserFacingError(err.message, "Telegram sign-in failed"),
      });
      return;
    }
    const message = toUserFacingError(
      err instanceof Error ? err.message : "Telegram authentication failed",
      "Telegram sign-in failed"
    );
    res.status(401).json({ error: message });
  }
});

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: userSelect,
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

router.patch("/me", authMiddleware, async (req: Request, res: Response) => {
  const { studyGoal, name, avatarUrl, currentPassword, newPassword } = req.body as {
    studyGoal?: string;
    name?: string;
    avatarUrl?: string | null;
    currentPassword?: string;
    newPassword?: string;
  };

  const stored = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: userSelect,
  });
  if (!stored) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const data: {
    studyGoal?: (typeof stored)["studyGoal"];
    name?: string;
    avatarUrl?: string | null;
    passwordHash?: string;
  } = {};

  if (studyGoal !== undefined) {
    if (!isStudyGoal(studyGoal)) {
      res.status(400).json({ error: "Invalid study goal" });
      return;
    }
    data.studyGoal = studyGoal;
  }

  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    data.name = trimmed;
  }

  if (avatarUrl !== undefined) {
    const trimmed = avatarUrl?.trim() || null;
    if (trimmed && !trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
      res.status(400).json({ error: "Picture URL must start with http(s)" });
      return;
    }
    data.avatarUrl = trimmed;
  }

  if (newPassword) {
    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    if (stored.passwordHash) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, stored.passwordHash))) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }
    }
    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data,
    select: userSelect,
  });
  res.json({ user: toPublicUser(user) });
});

router.delete("/me", authMiddleware, async (req: Request, res: Response) => {
  await prisma.user.delete({ where: { id: req.user!.userId } });
  res.json({ ok: true });
});

router.post(
  "/me/avatar",
  authMiddleware,
  avatarUpload.single("avatar"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Image file required" });
      return;
    }
    if (!file.mimetype.startsWith("image/")) {
      res.status(400).json({ error: "Only image files are allowed" });
      return;
    }

    const stored = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: userSelect,
    });
    if (!stored) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const packed = await losslessCompressBuffer(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    try {
      assertStorageRoom(stored, packed.length);
    } catch (err) {
      if (err instanceof QuotaError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      throw err;
    }

    const ext = file.mimetype === "image/png" ? "png" : "jpg";
    const key = `users/${req.user!.userId}/avatar.${ext}`;
    await uploadToS3(key, packed, file.mimetype);

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        avatarUrl: key,
        storageUsedBytes: { increment: BigInt(packed.length) },
      },
      select: userSelect,
    });

    res.json({ user: toPublicUser(user) });
  }
);

router.get("/avatar/:userId", async (req: Request, res: Response) => {
  const userId = param(req, "userId");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });
  if (!user?.avatarUrl) {
    res.status(404).json({ error: "No avatar" });
    return;
  }
  if (isHttpUrl(user.avatarUrl)) {
    res.redirect(user.avatarUrl);
    return;
  }
  if (!user.avatarUrl.startsWith(`users/${userId}/`)) {
    res.status(404).json({ error: "No avatar" });
    return;
  }
  try {
    const { buffer, contentType } = await getObjectBuffer(user.avatarUrl);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buffer);
  } catch {
    res.status(404).json({ error: "Avatar not found" });
  }
});

export default router;
