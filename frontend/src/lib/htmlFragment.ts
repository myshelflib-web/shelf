/** Make stored HTML safe to inject into the reader. */

const KILL_SELECTOR =
  "script, noscript, iframe, style, link, meta, object, embed, form, input, button, textarea, select, math, base, template, video, audio, applet, frame, frameset, canvas";

function scrubDom(root: ParentNode) {
  root.querySelectorAll(KILL_SELECTOR).forEach((el) => el.remove());
  // Drop non-drawing SVGs (keep blank-page ink)
  root.querySelectorAll("svg").forEach((el) => {
    if (!el.classList.contains("blank-draw-layer")) el.remove();
  });
  root.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value;
      if (
        name.startsWith("on") ||
        name === "srcdoc" ||
        name === "formaction" ||
        name === "xlink:href"
      ) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (name === "style") {
        const isCanvas =
          el.classList.contains("shelf-blank-canvas") &&
          /^width:\s*\d{3,5}px;\s*height:\s*\d{3,5}px;(?:\s*background-color:\s*#[0-9a-f]{3,8};)?(?:\s*color:\s*#[0-9a-f]{3,8};)?$/i.test(
            value.trim()
          );
        const isBox =
          el.classList.contains("shelf-text-box") &&
          /^left:\s*-?\d{1,5}px;\s*top:\s*-?\d{1,5}px;\s*width:\s*\d{2,4}px;?$/i.test(
            value.trim()
          );
        const isTextSpan =
          el.tagName === "SPAN" &&
          Boolean(el.closest(".shelf-text-box")) &&
          value
            .split(";")
            .map((p) => p.trim())
            .filter(Boolean)
            .every((p) =>
              /^(font-size|font-family|color|background-color):\s*.+$/i.test(p)
            );
        if (!isCanvas && !isBox && !isTextSpan) el.removeAttribute(attr.name);
        continue;
      }
      if (
        (name === "href" || name === "src") &&
        /^(javascript:|vbscript:|data:\s*text\/html)/i.test(value.trim())
      ) {
        el.removeAttribute(attr.name);
      }
      if (
        el.tagName === "IMG" &&
        name === "src" &&
        /^data:image\/svg/i.test(value.trim())
      ) {
        el.remove();
      }
    }
  });
}

export function extractReadableHtml(html: string): string {
  let s = html.replace(/^\uFEFF/, "").trim();
  if (!s) return "<p>This file had no readable HTML body.</p>";

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(s, "text/html");
    scrubDom(doc);
    const body = (doc.body?.innerHTML ?? "").trim();
    if (body) return body;
  }

  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "");
  s = s.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
  const body = s.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (body) s = body[1];
  s = s.replace(/<!DOCTYPE[^>]*>/gi, "");
  s = s.replace(/<\/?(html|head|body|meta|link|title)(\s[^>]*)?>/gi, "");
  s = s.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  return s.trim() || "<p>This file had no readable HTML body.</p>";
}

function plainLength(html: string): number {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
}

/** First block becomes a title; short following lines become a tight masthead. */
export function formatImportedHtml(html: string): string {
  let s = extractReadableHtml(html);
  if (!s || s.startsWith("<p>This file had no readable HTML body.")) return s;
  // Endless blank notes — keep structure as stored
  if (/shelf-blank-canvas/.test(s)) return s;
  if (/class=["']doc-masthead["']/.test(s)) return s;
  if (/preloaded-official-fallback/.test(s)) return s;

  if (!/<h1[\s>]/i.test(s)) {
    s = s.replace(
      /^(\s*)<p(\s[^>]*)?>([\s\S]*?)<\/p>/i,
      (_m, pre, _attrs, inner) => `${pre}<h1>${inner}</h1>`
    );
  }

  const blocks = s.split(/(?=<(?:h[1-6]|p|ul|ol|table|div|blockquote|pre)\b)/i);
  if (blocks.length < 2) return s;

  let cut = 1;
  for (let i = 1; i < Math.min(blocks.length, 12); i++) {
    const b = blocks[i];
    if (/^<h[2-6]\b/i.test(b.trim())) break;
    if (!/^<p\b/i.test(b.trim())) break;
    const len = plainLength(b);
    const looksAbstract = /abstract/i.test(b);
    if (looksAbstract || len > 220) break;
    cut = i + 1;
  }

  if (cut <= 1) return s;
  const head = blocks.slice(0, cut).join("");
  const rest = blocks.slice(cut).join("");
  return `<header class="doc-masthead">${head}</header>${rest}`;
}
