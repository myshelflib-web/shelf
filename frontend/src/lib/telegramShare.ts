/** Opens Telegram’s share picker with a URL (any chat the user chooses). */
export function telegramShareLinkUrl(url: string, text?: string): string {
  const params = new URLSearchParams({ url });
  const trimmed = text?.trim();
  if (trimmed) params.set("text", trimmed.slice(0, 200));
  return `https://t.me/share/url?${params.toString()}`;
}

export type TelegramShareKind = "file" | "chat" | "quiz";

export type TelegramShareTarget = {
  kind: TelegramShareKind;
  label: string;
  title: string;
  path: string;
  pageId?: string;
};

/** What the header Telegram panel can share from the current route. */
export function telegramShareTarget(
  pathname: string,
  file?: { title?: string; pageId?: string } | null
): TelegramShareTarget | null {
  if (/^\/study-ai\/[^/]+/.test(pathname)) {
    return {
      kind: "chat",
      label: "Share this chat",
      title: "Study AI chat on Shelf",
      path: pathname,
    };
  }
  if (/^\/quiz\/[^/]+/.test(pathname)) {
    return {
      kind: "quiz",
      label: "Share this quiz",
      title: "Quiz on Shelf",
      path: pathname,
    };
  }
  if (
    pathname.startsWith("/my-content/") &&
    pathname !== "/my-content" &&
    !pathname.startsWith("/my-content/shared/")
  ) {
    return {
      kind: "file",
      label: "Share this file",
      title: file?.title?.trim() || "Library page",
      path: pathname,
      pageId: file?.pageId,
    };
  }
  return null;
}
