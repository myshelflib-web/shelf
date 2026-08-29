import crypto from "crypto";
import { EmailOtpPurpose } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import {
  passwordResetOtpEmail,
  signupOtpEmail,
} from "./templates.js";
import { sendEmail } from "./sendEmail.js";
import { isEmailConfigured } from "./config.js";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MS = 15 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(OTP_LENGTH, "0");
}

function hashOtp(code: string): string {
  const secret = process.env.JWT_SECRET ?? "dev-otp-secret";
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

function verifyOtpHash(code: string, codeHash: string): boolean {
  const expected = hashOtp(code);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(codeHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function assertSendRateLimit(email: string, purpose: EmailOtpPurpose) {
  const latest = await prisma.emailOtp.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (latest) {
    const elapsed = Date.now() - latest.createdAt.getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000)
      );
      throw new OtpCooldownError(retryAfterSec);
    }
  }

  const since = new Date(Date.now() - SEND_WINDOW_MS);
  const recent = await prisma.emailOtp.count({
    where: { email, purpose, createdAt: { gte: since } },
  });
  if (recent >= MAX_SENDS_PER_WINDOW) {
    throw new OtpRateLimitError();
  }
}

export class OtpCooldownError extends Error {
  retryAfterSec: number;
  constructor(retryAfterSec: number) {
    super(
      `Please wait ${retryAfterSec}s before requesting another code`
    );
    this.name = "OtpCooldownError";
    this.retryAfterSec = retryAfterSec;
  }
}

export class OtpRateLimitError extends Error {
  constructor() {
    super("Too many codes sent. Please wait a few minutes and try again.");
    this.name = "OtpRateLimitError";
  }
}

export class OtpInvalidError extends Error {
  constructor() {
    super("Invalid or expired verification code");
    this.name = "OtpInvalidError";
  }
}

export async function createAndSendOtp(opts: {
  email: string;
  purpose: EmailOtpPurpose;
  name?: string;
}): Promise<void> {
  const email = normalizeEmail(opts.email);
  await assertSendRateLimit(email, opts.purpose);

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.emailOtp.deleteMany({ where: { email, purpose: opts.purpose } });
  await prisma.emailOtp.create({
    data: {
      email,
      purpose: opts.purpose,
      codeHash: hashOtp(code),
      expiresAt,
    },
  });

  const template =
    opts.purpose === "SIGNUP"
      ? signupOtpEmail(opts.name, code, email)
      : passwordResetOtpEmail(opts.name, code, email);

  if (!isEmailConfigured()) {
    logger.info("email.otp.dev", { email, purpose: opts.purpose, code });
    return;
  }

  await sendEmail({ to: email, ...template });
}

export async function verifyOtp(opts: {
  email: string;
  purpose: EmailOtpPurpose;
  code: string;
}): Promise<void> {
  const email = normalizeEmail(opts.email);
  const trimmed = opts.code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    throw new OtpInvalidError();
  }

  const record = await prisma.emailOtp.findFirst({
    where: { email, purpose: opts.purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date()) {
    throw new OtpInvalidError();
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new OtpInvalidError();
  }

  if (!verifyOtpHash(trimmed, record.codeHash)) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new OtpInvalidError();
  }

  await prisma.emailOtp.delete({ where: { id: record.id } });
}
