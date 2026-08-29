import {
  llmTokenLimit,
  storageLimitBytes,
  usedBytes,
  usedVectorChunks,
  vectorChunkLimit,
} from "./quotas.js";
import { isPremiumUser } from "./paywall.js";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  plan: true,
  subscriptionExpiresAt: true,
  studyGoal: true,
  storageUsedBytes: true,
  llmTokensUsed: true,
  llmTokensResetAt: true,
  vectorChunksUsed: true,
  coinBalance: true,
  passwordHash: true,
  telegramId: true,
  telegramUsername: true,
  createdAt: true,
} as const;

export { userSelect };

type DbUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  plan: string;
  subscriptionExpiresAt?: Date | string | null;
  studyGoal: string;
  storageUsedBytes: bigint | number;
  llmTokensUsed: number;
  llmTokensResetAt?: Date | string | null;
  vectorChunksUsed: number;
  coinBalance?: number;
  passwordHash?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  createdAt?: Date | string | null;
};

export function toPublicUser(user: DbUser) {
  const quotaUser = {
    plan: user.plan,
    role: user.role,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    storageUsedBytes: user.storageUsedBytes,
    llmTokensUsed: user.llmTokensUsed,
    vectorChunksUsed: user.vectorChunksUsed,
    createdAt: user.createdAt,
  };
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    studyGoal: user.studyGoal,
    hasPassword: Boolean(user.passwordHash),
    isPremium: isPremiumUser(quotaUser),
    storageUsedBytes: usedBytes(quotaUser),
    storageLimitBytes: storageLimitBytes(quotaUser),
    llmTokensUsed: user.llmTokensUsed,
    llmTokenLimit: llmTokenLimit(quotaUser),
    vectorChunksUsed: usedVectorChunks(quotaUser),
    vectorChunkLimit: vectorChunkLimit(quotaUser),
    coinBalance: user.coinBalance ?? 0,
    telegramLinked: Boolean(user.telegramId),
    telegramUsername: user.telegramUsername ?? null,
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : user.createdAt ?? undefined,
  };
}
