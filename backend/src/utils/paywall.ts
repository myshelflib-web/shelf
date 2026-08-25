interface PremiumUser {
  plan: string;
  role: string;
  subscriptionExpiresAt?: Date | string | null;
}

export function isPremiumUser(user: PremiumUser): boolean {
  if (user.role === "ADMIN") return true;
  if (user.plan !== "PREMIUM") return false;
  if (!user.subscriptionExpiresAt) return true;
  return new Date(user.subscriptionExpiresAt) > new Date();
}

/**
 * Returns a preview of HTML by keeping the first N% of block-level elements.
 */
export function truncateHtmlPreview(html: string, previewPercent: number): string {
  const percent = Math.min(100, Math.max(10, previewPercent));
  const blocks = html.match(/<(h2|p|ul|ol|li|blockquote)[\s>][\s\S]*?<\/\1>/gi);

  if (!blocks || blocks.length === 0) {
    const cutAt = Math.floor(html.length * (percent / 100));
    return html.slice(0, cutAt) + (html.length > cutAt ? "..." : "");
  }

  const keep = Math.max(1, Math.ceil(blocks.length * (percent / 100)));
  return blocks.slice(0, keep).join("\n");
}
