/**
 * Wrap curriculum / generated HTML as a Shelf Doc shell (annotate, no live edit).
 * Mirrors frontend/src/lib/docEditor.ts — keep behavior in sync.
 */

export function isReadOnlyDocHtml(html: string): boolean {
  return (
    /shelf-doc-readonly/.test(html) || /data-shelf-readonly/.test(html)
  );
}

export function isLiveDocEditorHtml(html: string): boolean {
  return /shelf-doc-editor/.test(html) && !isReadOnlyDocHtml(html);
}

/** Pages that should be stored/served as read-only Docs. */
export function isCurriculumGeneratedHtml(html: string): boolean {
  if (!html) return false;
  if (isReadOnlyDocHtml(html)) return true;
  if (isLiveDocEditorHtml(html)) return false;
  return /shelf-generated|shelf-doc-masthead|doc-masthead/.test(html);
}

function parseDocBody(html: string): string {
  const m = html.match(
    /class="shelf-doc-body"[^>]*>([\s\S]*)<\/div>\s*<\/div>/
  );
  return m?.[1]?.trim() || "<p><br></p>";
}

export function extractDocInnerHtml(html: string): string {
  const trimmed = html.replace(/^\uFEFF/, "").trim();
  if (!trimmed) return "<p><br></p>";
  if (/class="[^"]*shelf-doc-body/.test(trimmed)) {
    return parseDocBody(trimmed);
  }

  const header = trimmed.match(
    /<header\b[^>]*class="[^"]*(?:doc-masthead|shelf-doc-masthead)[^"]*"[^>]*>[\s\S]*?<\/header>/i
  );
  const article = trimmed.match(/<article\b[^>]*>[\s\S]*?<\/article>/i);
  if (header || article) {
    return `${header?.[0] ?? ""}${article?.[0] ?? ""}`.trim();
  }

  const body = trimmed.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (body) return body[1]!.trim() || "<p><br></p>";

  return trimmed
    .replace(/^<!DOCTYPE[^>]*>/i, "")
    .replace(/<\/?html\b[^>]*>/gi, "")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "")
    .trim();
}

export function wrapAsReadOnlyDocHtml(html: string): string {
  if (isReadOnlyDocHtml(html)) return html;
  if (isLiveDocEditorHtml(html)) return html;
  const inner = extractDocInnerHtml(html);
  return `<div class="shelf-doc-editor shelf-doc-readonly" data-shelf-readonly="1"><div class="shelf-doc-body">${inner}</div></div>`;
}

/**
 * Convert a stored Learn page (full document or fragment) into the Doc
 * shell while keeping doctype/head and generated look-and-feel classes.
 */
export function ensureStoredReadOnlyDocDocument(html: string): string {
  const trimmed = html.replace(/^\uFEFF/, "").trim();
  if (!trimmed) return trimmed;
  if (isReadOnlyDocHtml(trimmed)) return trimmed;
  if (isLiveDocEditorHtml(trimmed)) return trimmed;
  if (!isCurriculumGeneratedHtml(trimmed)) return trimmed;

  const shell = wrapAsReadOnlyDocHtml(trimmed);
  const bodyMatch = trimmed.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    // Fragment / already-body content — store as a minimal HTML document.
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
</head>
<body>
${shell}
</body>
</html>`;
  }

  return trimmed.replace(bodyMatch[0], `<body>\n${shell}\n</body>`);
}

export function needsReadOnlyDocConversion(html: string): boolean {
  if (!html?.trim()) return false;
  if (isReadOnlyDocHtml(html)) return false;
  return isCurriculumGeneratedHtml(html);
}
