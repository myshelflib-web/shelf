import { telegramShareLinkUrl } from "@/lib/telegramShare";

export function shareCardLandingUrl(affiliateCode?: string | null): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://myshelflib.com";
  const code = affiliateCode?.trim().toUpperCase();
  if (code) return `${origin}/?ref=${encodeURIComponent(code)}`;
  return origin;
}

export function shareCardFilename(streak: number) {
  return `shelf-streak-${Math.max(0, streak)}-days.png`;
}

export async function downloadShareCardBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function nativeShareCardBlob(
  blob: Blob,
  opts: { title: string; text: string; filename: string }
): Promise<boolean> {
  const file = new File([blob], opts.filename, { type: "image/png" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: opts.title,
      text: opts.text,
      files: [file],
    });
    return true;
  }
  if (navigator.share) {
    await navigator.share({ title: opts.title, text: opts.text });
    return true;
  }
  return false;
}

export function openTelegramShareCard(
  landingUrl: string,
  streak: number,
  todayMinutes?: string
) {
  const line =
    todayMinutes && todayMinutes !== "0m"
      ? `${streak}-day study streak on Shelf · ${todayMinutes} today`
      : `${streak}-day study streak on Shelf`;
  window.open(telegramShareLinkUrl(landingUrl, line), "_blank", "noopener,noreferrer");
}
