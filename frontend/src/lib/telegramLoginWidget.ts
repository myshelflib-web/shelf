/** Telegram Login Widget errors injected into the DOM by telegram.org. */
const WIDGET_ERROR =
  /bot domain invalid|username invalid|bot id invalid|not authorized|domain invalid/i;

export function isTelegramWidgetError(text: string): boolean {
  return WIDGET_ERROR.test(text.replace(/\s+/g, " ").trim());
}

/** Hostnames allowed to show the Login Widget (comma-separated env). */
export function isTelegramLoginHostAllowed(): boolean {
  if (typeof window === "undefined") return true;

  const listed = process.env.NEXT_PUBLIC_TELEGRAM_LOGIN_HOSTS?.split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  const host = window.location.hostname.toLowerCase();
  if (listed?.length) return listed.includes(host);

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      return new URL(site).hostname.toLowerCase() === host;
    } catch {
      return true;
    }
  }
  return true;
}

export function readTelegramWidgetError(root: HTMLElement | null): string | null {
  if (!root) return null;
  const text = root.textContent ?? "";
  if (!isTelegramWidgetError(text)) return null;
  return text.replace(/\s+/g, " ").trim();
}
