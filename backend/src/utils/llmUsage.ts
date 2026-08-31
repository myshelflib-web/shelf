import prisma from "./prisma.js";
import { recordQuotaCharge } from "./appMetrics.js";
import {
  assertLlmRoom,
  shouldResetLlmWindow,
  type QuotaUser,
} from "./quotas.js";

export type LlmUsageRow = QuotaUser & {
  id: string;
  llmTokensUsed: number;
  llmTokensResetAt: Date | null;
};

const usageSelect = {
  id: true,
  plan: true,
  role: true,
  subscriptionExpiresAt: true,
  llmTokensUsed: true,
  llmTokensResetAt: true,
} as const;

/** Reset monthly counter when the calendar month rolls over. */
export async function refreshLlmUsage(userId: string): Promise<LlmUsageRow> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: usageSelect,
  });
  if (!user) {
    throw new Error("User not found");
  }

  if (!shouldResetLlmWindow(user.llmTokensResetAt)) {
    return user;
  }

  return prisma.user.update({
    where: { id: userId },
    data: { llmTokensUsed: 0, llmTokensResetAt: new Date() },
    select: usageSelect,
  });
}

/** True when the user still has room in their monthly pool (no cost estimate). */
export async function assertLlmBudget(
  userId: string,
  extraTokens = 1
): Promise<LlmUsageRow> {
  const user = await refreshLlmUsage(userId);
  assertLlmRoom(user, extraTokens);
  return user;
}

/** Bill tokens after a successful LLM call. */
export async function chargeLlmTokens(
  userId: string,
  tokens: number,
  flow?: string
): Promise<void> {
  if (!Number.isFinite(tokens) || tokens <= 0) return;

  await refreshLlmUsage(userId);

  await prisma.user.update({
    where: { id: userId },
    data: { llmTokensUsed: { increment: tokens } },
  });

  recordQuotaCharge({ flow, tokens });
}
