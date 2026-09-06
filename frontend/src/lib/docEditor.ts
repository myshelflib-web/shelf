export function isDocEditorHtml(html: string): boolean {
  return /shelf-doc-editor/.test(html);
}

/** Curriculum / Learn pages shown as Doc — annotate yes, contentEditable no. */
export function isReadOnlyDocHtml(html: string): boolean {
  return (
    /shelf-doc-readonly/.test(html) || /data-shelf-readonly/.test(html)
  );
}

/** User-created Doc (live editor). Read-only curriculum docs are excluded. */
export function isLiveDocEditorHtml(html: string): boolean {
  return isDocEditorHtml(html) && !isReadOnlyDocHtml(html);
}

/** Generated / preloaded curriculum HTML that must never enter Edit. */
export function isCurriculumReadOnlyHtml(html: string): boolean {
  if (!html) return false;
  if (isReadOnlyDocHtml(html)) return true;
  if (isLiveDocEditorHtml(html)) return false;
  return /shelf-generated|shelf-doc-masthead|preloaded-official-fallback/.test(
    html
  );
}

export function createDocHtml(title: string): string {
  const safe = title
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const heading = safe ? `<h1>${safe}</h1>` : "";
  return `<div class="shelf-doc-editor"><div class="shelf-doc-body">${heading}<p><br></p></div></div>`;
}

export function parseDocBody(html: string): string {
  if (typeof document === "undefined") {
    const m = html.match(
      /class="shelf-doc-body"[^>]*>([\s\S]*)<\/div>\s*<\/div>/
    );
    return m?.[1]?.trim() || "<p><br></p>";
  }
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const body = wrap.querySelector(".shelf-doc-body");
  return body?.innerHTML?.trim() || "<p><br></p>";
}

export function serializeDocBody(innerHtml: string): string {
  return `<div class="shelf-doc-editor"><div class="shelf-doc-body">${innerHtml}</div></div>`;
}

/** Inner HTML to place inside `.shelf-doc-body` (masthead + article when present). */
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

/**
 * Wrap curriculum / generated HTML as a Shelf Doc shell without enabling live edit.
 * Idempotent for already-wrapped readonly docs; leaves live user Docs alone.
 */
export function wrapAsReadOnlyDocHtml(html: string): string {
  if (isReadOnlyDocHtml(html)) return html;
  if (isLiveDocEditorHtml(html)) return html;
  const inner = extractDocInnerHtml(html);
  return `<div class="shelf-doc-editor shelf-doc-readonly" data-shelf-readonly="1"><div class="shelf-doc-body">${inner}</div></div>`;
}

export function ensureReadOnlyDocHtml(html: string): string {
  if (isReadOnlyDocHtml(html)) return html;
  if (isLiveDocEditorHtml(html)) return html;
  if (!isCurriculumReadOnlyHtml(html)) return html;
  return wrapAsReadOnlyDocHtml(html);
}
