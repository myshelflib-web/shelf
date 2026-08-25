import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import prisma from "../utils/prisma.js";
import { signToken, authMiddleware } from "../middleware/auth.js";
import { verifyGoogleToken } from "../services/googleAuth.js";
import { uploadToS3, getObjectBuffer } from "../services/s3.js";
import { isStudyGoal } from "../studyGoal.js";
import { toPublicUser, userSelect } from "../utils/publicUser.js";
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

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: "Email, password, and name required" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: userSelect,
  });

  issueAuthResponse(res, user, 201);
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

    issueAuthResponse(res, user, 201);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Google authentication failed";
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

    try {
      assertStorageRoom(stored, file.size);
    } catch (err) {
      if (err instanceof QuotaError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      throw err;
    }

    const ext = file.mimetype === "image/png" ? "png" : "jpg";
    const key = `users/${req.user!.userId}/avatar.${ext}`;
    await uploadToS3(key, file.buffer, file.mimetype);

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        avatarUrl: key,
        storageUsedBytes: { increment: BigInt(file.size) },
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
