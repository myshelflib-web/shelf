import type { Response } from "express";
import prisma from "../utils/prisma.js";
import { signToken } from "../middleware/auth.js";
import { toPublicUser, userSelect } from "../utils/publicUser.js";
import {
  displayNameFromTelegram,
  telegramPlaceholderEmail,
  verifyTelegramLogin,
} from "./telegramAuth.js";

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

/** Login Widget → find or create Shelf user, then issue JWT. */
export async function authenticateTelegramLogin(
  res: Response,
  body: Record<string, unknown>
): Promise<void> {
  const profile = verifyTelegramLogin(body);
  const name = displayNameFromTelegram({
    first_name: profile.firstName,
    last_name: profile.lastName,
    username: profile.username,
  });

  const existing = await prisma.user.findFirst({
    where: { telegramId: profile.telegramId },
  });

  if (existing) {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        telegramUsername: profile.username ?? existing.telegramUsername,
        telegramLinkedAt: existing.telegramLinkedAt ?? new Date(),
        name: existing.name || name,
        avatarUrl: existing.avatarUrl?.startsWith("users/")
          ? existing.avatarUrl
          : profile.photoUrl ?? existing.avatarUrl,
      },
      select: userSelect,
    });
    issueAuthResponse(res, user);
    return;
  }

  const email = telegramPlaceholderEmail(profile.telegramId);
  const user = await prisma.user.create({
    data: {
      email,
      telegramId: profile.telegramId,
      telegramUsername: profile.username ?? null,
      telegramLinkedAt: new Date(),
      name,
      avatarUrl: profile.photoUrl ?? null,
    },
    select: userSelect,
  });

  issueAuthResponse(res, user, 201);
}
