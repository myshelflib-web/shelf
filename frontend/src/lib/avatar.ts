import { API_URL } from "@/lib/api";
import { User } from "@/types";

export function avatarSrc(user: Pick<User, "id" | "name" | "avatarUrl">): string | null {
  if (!user.avatarUrl) return null;
  if (
    user.avatarUrl.startsWith("http://") ||
    user.avatarUrl.startsWith("https://")
  ) {
    return user.avatarUrl;
  }
  return `${API_URL}/api/auth/avatar/${user.id}?v=${encodeURIComponent(user.avatarUrl)}`;
}
