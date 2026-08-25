import { User } from "@/types";

export function isPremiumUser(user: User | null): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.plan !== "PREMIUM") return false;
  if (!user.subscriptionExpiresAt) return true;
  return new Date(user.subscriptionExpiresAt) > new Date();
}
