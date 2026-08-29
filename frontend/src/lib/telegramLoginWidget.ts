/** Telegram Login Widget errors injected into the DOM by telegram.org. */
const WIDGET_ERROR =
  /bot domain invalid|username invalid|bot id invalid|not authorized|domain invalid/i;

export function isTelegramWidgetError(text: string): boolean {
  return WIDGET_ERROR.test(text.replace(/\s+/g, " ").trim());
}

export function normalizeTelegramBotUsername(
  raw: string | null | undefined
): string | null {
  const value = (raw ?? "").trim().replace(/^@/, "");
  if (!value || /your-telegram|changeme|example/i.test(value)) return null;
  return value;
}

function hostAliases(hostname: string): string[] {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1") {
    return ["localhost", "127.0.0.1", "[::1]", "::1"];
  }
  return [h];
}

export function isHostnameAllowedForTelegramLogin(
  hostname: string,
  allowlistCsv: string | undefined
): boolean {
  const listed = allowlistCsv
    ?.split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (!listed?.length) return true;
  return hostAliases(hostname).some((h) => listed.includes(h));
}

/**
 * Optional allowlist via NEXT_PUBLIC_TELEGRAM_LOGIN_HOSTS only.
 * When unset, every host may load the widget (BotFather /setdomain is the source of truth).
 */
export function isTelegramLoginHostAllowed(): boolean {
  if (typeof window === "undefined") return true;
  return isHostnameAllowedForTelegramLogin(
    window.location.hostname,
    process.env.NEXT_PUBLIC_TELEGRAM_LOGIN_HOSTS
  );
}

export function readTelegramWidgetError(root: HTMLElement | null): string | null {
  if (!root) return null;
  const text = root.textContent ?? "";
  if (!isTelegramWidgetError(text)) return null;
  return text.replace(/\s+/g, " ").trim();
}

/** True when Telegram injected the interactive login control (not just an error string). */
export function hasTelegramLoginWidget(root: HTMLElement | null): boolean {
  if (!root) return false;
  return Boolean(
    root.querySelector("iframe, a[href*='telegram.org'], a[href*='t.me']")
  );
}
