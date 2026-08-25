export function isDocEditorHtml(html: string): boolean {
  return /shelf-doc-editor/.test(html);
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
    const m = html.match(/class="shelf-doc-body"[^>]*>([\s\S]*)<\/div>\s*<\/div>/);
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
