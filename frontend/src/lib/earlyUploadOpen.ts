import type { UserContentType } from "@/types";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function contentTypeFromUploadFile(file: File): UserContentType {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || (file.type || "").toLowerCase() === "application/pdf") {
    return "PDF";
  }
  if (name.endsWith(".docx")) return "DOCX";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "MARKDOWN";
  if (name.endsWith(".txt")) return "TEXT";
  return "PDF";
}

/** Local HTML shell so the reader can open before server convert finishes. */
export async function earlyHtmlForUploadFile(
  file: File,
  contentType: UserContentType
): Promise<string | undefined> {
  if (contentType === "PDF") return undefined;
  if (contentType === "DOCX") {
    return "<p>Preparing document…</p>";
  }
  try {
    const text = await file.text();
    const body = escapeHtml(text);
    return `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:13px;line-height:1.5;margin:0">${body}</pre>`;
  } catch {
    return "<p>Preparing document…</p>";
  }
}
