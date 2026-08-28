import prisma from "../utils/prisma.js";
import { isPremiumUser } from "../utils/paywall.js";

/** Which Gemini API key pool to use for a request. */
export type ApiKeyRoute = "paid" | "free";

export function apiKeyRouteForUser(user: {
  plan: string;
  role: string;
  subscriptionExpiresAt?: Date | string | null;
}): ApiKeyRoute {
  if (user.role === "ADMIN" || isPremiumUser(user)) return "paid";
  return "free";
}

/** Resolve paid vs free API routing from the user's Shelf plan. */
export async function resolveApiKeyRouteForUserId(
  userId: string
): Promise<ApiKeyRoute> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, subscriptionExpiresAt: true },
  });
  if (!user) return "free";
  return apiKeyRouteForUser(user);
}
