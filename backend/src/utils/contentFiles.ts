/** Non-PDF upload size cap (TXT/MD/DOCX). PDFs have no per-file cap — only plan storage quota. */
export const DOCUMENT_MAX_BYTES = 50 * 1024 * 1024;

/** Soft cap when buffering a remote PDF into memory (link import). Not an upload limit. */
export const PDF_IMPORT_MAX_BYTES = 40 * 1024 * 1024;

export type DetectedFileKind = "pdf" | "markdown" | "text" | "docx";

const EXT_MAP: Record<string, DetectedFileKind> = {
  pdf: "pdf",
  md: "markdown",
  markdown: "markdown",
  txt: "text",
  docx: "docx",
};

const MIME_BY_KIND: Record<DetectedFileKind, Set<string>> = {
  pdf: new Set(["application/pdf", "application/octet-stream", ""]),
  markdown: new Set([
    "text/markdown",
    "text/x-markdown",
    "text/plain",
    "application/octet-stream",
    "",
  ]),
  text: new Set(["text/plain", "application/octet-stream", ""]),
  docx: new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/octet-stream",
    "",
  ]),
};

const BLOCKED_EXT = new Set([
  "html",
  "htm",
  "xhtml",
  "shtml",
  "mhtml",
  "mht",
  "svg",
  "xml",
  "xsl",
  "xslt",
  "js",
  "mjs",
  "cjs",
  "ts",
  "jsx",
  "tsx",
  "php",
  "asp",
  "aspx",
  "jsp",
  "cgi",
  "hta",
  "htaccess",
  "wasm",
  "swf",
  "doc",
  "dot",
  "rtf",
  "odt",
]);

export const ALLOWED_UPLOAD_HINT =
  "Use PDF, TXT, MD, or DOCX. HTML and other executable formats are not allowed.";

export function detectFileKind(
  filename: string,
  mimeType: string
): DetectedFileKind | null {
  const base = filename.split(/[/\\]/).pop() ?? "";
  const ext = base.includes(".")
    ? base.split(".").pop()!.toLowerCase()
    : "";
  if (!ext || BLOCKED_EXT.has(ext)) return null;
  const kind = EXT_MAP[ext];
  if (!kind) return null;
  const mime = (mimeType || "").split(";")[0].trim().toLowerCase();
  if (!MIME_BY_KIND[kind].has(mime)) return null;
  return kind;
}

export function validateUploadBuffer(
  kind: DetectedFileKind,
  buffer: Buffer
): string | null {
  if (!buffer.length) return "File is empty";

  if (kind === "pdf") {
    if (!buffer.subarray(0, 5).toString("latin1").startsWith("%PDF")) {
      return "File is not a valid PDF";
    }
    return null;
  }

  if (kind === "docx") {
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      return "File is not a valid DOCX";
    }
    return null;
  }

  const head = buffer.subarray(0, 800).toString("utf8").trimStart();
  if (
    /^<!doctype\s+html/i.test(head) ||
    /^<html[\s>]/i.test(head) ||
    /^<svg[\s>]/i.test(head) ||
    /^<script[\s>]/i.test(head) ||
    /^<\?xml/i.test(head)
  ) {
    return ALLOWED_UPLOAD_HINT;
  }
  return null;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "del",
  "ins",
  "sub",
  "sup",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "img",
  "a",
  "span",
  "div",
  "mark",
  "hr",
  "font",
  "svg",
  "path",
  "g",
]);

const VOID_TAGS = new Set(["br", "img", "hr", "path"]);

const DANGEROUS_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "link",
  "meta",
  "base",
  "math",
  "applet",
  "frame",
  "frameset",
  "noscript",
  "template",
  "video",
  "audio",
  "source",
  "track",
  "canvas",
  "dialog",
];

function isSafeHref(value: string): boolean {
  const v = value.trim();
  if (!v || v.startsWith("#")) return /^#[\w.-]*$/.test(v) || v === "#";
  return /^(https?:|mailto:)/i.test(v);
}

function isSafeImgSrc(value: string): boolean {
  const v = value.trim();
  if (/^https?:\/\//i.test(v) && !/[\s<>]/.test(v)) return true;
  return /^data:image\/(png|jpe?g|gif|webp|bmp);base64,[a-z0-9+/=\s]+$/i.test(
    v
  );
}

function isSafeClass(value: string): boolean {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .every((c) =>
      /^(doc-masthead|highlight-(yellow|green|blue|pink|orange)|has-note|personal-content|blank-draw-layer|blank-draw-stroke|shelf-blank-canvas|shelf-blank-text|shelf-blank-textboxes|shelf-text-box|shelf-sketch-notebook|shelf-sketch-page|shelf-doc-editor|shelf-doc-body|blank-canvas-surface|blank-page-editor|prose-content|sketch-template-blank|sketch-template-ruled|sketch-template-grid|sketch-page-sheet)$/.test(
        c
      )
    );
}

function isSafeSvgPaint(value: string): boolean {
  return (
    value === "none" ||
    /^#[0-9a-f]{3,8}$/i.test(value) ||
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/i.test(
      value
    )
  );
}

function filterAttrs(tag: string, raw: string): string {
  const out: string[] = [];
  const attrRe =
    /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(raw))) {
    const name = m[1].toLowerCase();
    if (name.startsWith("on") || name === "srcdoc") {
      continue;
    }
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    if (/javascript:|vbscript:|data:\s*text\/html/i.test(value)) continue;

    if (
      name === "style" &&
      tag === "div" &&
      (/^width:\s*\d{3,5}px;\s*height:\s*\d{3,5}px;(?:\s*background-color:\s*#[0-9a-f]{3,8};)?(?:\s*color:\s*#[0-9a-f]{3,8};)?$/i.test(
        value.trim()
      ) ||
        /^left:\s*-?\d{1,5}px;\s*top:\s*-?\d{1,5}px;\s*width:\s*\d{2,4}px;?$/i.test(
          value.trim()
        ))
    ) {
      out.push(`style="${escapeHtml(value.trim())}"`);
      continue;
    }
    if (
      name === "style" &&
      tag === "div" &&
      /^width:\d{3,5}px;height:\d{3,5}px;background-color:#[0-9a-f]{3,8};color:#[0-9a-f]{3,8};$/i.test(
        value.trim()
      )
    ) {
      out.push(`style="${escapeHtml(value.trim())}"`);
      continue;
    }
    if (name === "style" && tag === "span") {
      const cleaned = value
        .split(";")
        .map((p) => p.trim())
        .filter(Boolean)
        .filter((p) =>
          /^(font-size|font-family|color|background-color):\s*.+$/i.test(p)
        )
        .join("; ");
      if (cleaned) out.push(`style="${escapeHtml(cleaned)}"`);
      continue;
    }
    if (name === "style") continue;

    if (name === "class" && isSafeClass(value)) {
      out.push(`class="${escapeHtml(value)}"`);
    } else if (name === "id" && /^[a-z][\w:-]{0,80}$/i.test(value)) {
      out.push(`id="${escapeHtml(value)}"`);
    } else if (
      (name === "data-w" || name === "data-h" || name === "data-x" || name === "data-y") &&
      /^-?\d{1,5}$/.test(value)
    ) {
      out.push(`${name}="${value}"`);
    } else if (name === "data-bg" && /^#[0-9a-f]{3,8}$/i.test(value)) {
      out.push(`data-bg="${value}"`);
    } else if (name === "data-bg-tone" && /^(dark|light)$/.test(value)) {
      out.push(`data-bg-tone="${value}"`);
    } else if (name === "data-id" && /^[\w-]{1,40}$/.test(value)) {
      out.push(`data-id="${escapeHtml(value)}"`);
    } else if (name === "data-active" && /^\d{1,3}$/.test(value)) {
      out.push(`data-active="${value}"`);
    } else if (name === "data-index" && /^\d{1,3}$/.test(value)) {
      out.push(`data-index="${value}"`);
    } else if (
      name === "data-template" &&
      /^(blank|ruled|grid)$/.test(value)
    ) {
      out.push(`data-template="${value}"`);
    } else if (tag === "a" && name === "href" && isSafeHref(value)) {
      out.push(`href="${escapeHtml(value)}" rel="noopener noreferrer"`);
    } else if (tag === "a" && name === "title") {
      out.push(`title="${escapeHtml(value.slice(0, 200))}"`);
    } else if (tag === "img" && name === "src" && isSafeImgSrc(value)) {
      out.push(`src="${value.replace(/"/g, "")}"`);
    } else if (tag === "img" && name === "alt") {
      out.push(`alt="${escapeHtml(value.slice(0, 200))}"`);
    } else if (
      (tag === "td" || tag === "th") &&
      (name === "colspan" || name === "rowspan") &&
      /^\d{1,2}$/.test(value)
    ) {
      out.push(`${name}="${value}"`);
    } else if (tag === "font" && name === "color" && isSafeSvgPaint(value)) {
      out.push(`color="${escapeHtml(value)}"`);
    } else if (tag === "font" && name === "size" && /^[1-7]$/.test(value)) {
      out.push(`size="${value}"`);
    } else if (
      tag === "svg" &&
      ((name === "viewbox" && /^[\d.\s,-]+$/i.test(value)) ||
        (name === "width" && /^\d{1,5}$/.test(value)) ||
        (name === "height" && /^\d{1,5}$/.test(value)) ||
        (name === "preserveaspectratio" &&
          /^(none|x(Min|Mid|Max)Y(Min|Mid|Max)\s+(meet|slice))$/i.test(value)))
    ) {
      out.push(`${name}="${escapeHtml(value)}"`);
    } else if (
      tag === "path" &&
      ((name === "d" && value.length < 100000 && !/[<>]/.test(value)) ||
        (name === "fill" && isSafeSvgPaint(value)) ||
        (name === "stroke" && isSafeSvgPaint(value)) ||
        (name === "stroke-width" && /^[\d.]+$/.test(value)) ||
        (name === "stroke-linecap" && /^(round|butt|square)$/i.test(value)) ||
        (name === "stroke-linejoin" &&
          /^(round|miter|bevel)$/i.test(value)) ||
        (name === "vector-effect" && value === "non-scaling-stroke"))
    ) {
      out.push(`${name}="${escapeHtml(value)}"`);
    }
  }
  return out.length ? ` ${out.join(" ")}` : "";
}

/** Allowlist sanitizer for HTML stored in the reader. */
export function sanitizeStoredHtml(html: string): string {
  let s = html.replace(/^\uFEFF/, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  for (const tag of DANGEROUS_TAGS) {
    s = s.replace(
      new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, "gi"),
      ""
    );
    s = s.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), "");
  }
  s = s.replace(/<\/?([a-zA-Z][\w:-]*)\b([^>]*)>/g, (full, name: string, attrs: string) => {
    const closing = full.startsWith("</");
    const tag = name.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (closing) return `</${tag}>`;
    const clean = filterAttrs(tag, attrs);
    if (VOID_TAGS.has(tag)) return `<${tag}${clean} />`;
    return `<${tag}${clean}>`;
  });
  return s.trim();
}

/** Pull body HTML so fragments can be injected into a reader div. */
export function extractReadableHtml(html: string): string {
  let s = html.replace(/^\uFEFF/, "").trim();
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "");
  s = s.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "");
  const body = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) s = body[1];
  s = s.replace(/<!DOCTYPE[^>]*>/gi, "");
  s = s.replace(/<\/?(html|head|body|meta|link|title)(\s[^>]*)?>/gi, "");
  s = s.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  return sanitizeStoredHtml(s);
}

function plainLength(html: string): number {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
}

/** First block becomes a title; short following lines become a tight masthead. */
export function formatImportedHtml(html: string): string {
  let s = extractReadableHtml(html);
  if (!s) return "<p></p>";
  if (/class=["']doc-masthead["']/.test(s)) return s;

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

export function markdownToHtml(markdown: string, title: string): string {
  const escaped = escapeHtml(markdown);
  const body = escaped
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  if (/^<h[1-3]\b/i.test(body.trim())) {
    return formatImportedHtml(body);
  }
  return formatImportedHtml(`<h1>${escapeHtml(title)}</h1><p>${body}</p>`);
}

export function textToHtml(text: string, title: string): string {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return formatImportedHtml(
    `<h1>${escapeHtml(title)}</h1>${paragraphs || "<p></p>"}`
  );
}

export async function bufferToHtml(
  buffer: Buffer,
  kind: DetectedFileKind,
  title: string
): Promise<string> {
  const raw = buffer.toString("utf8");
  switch (kind) {
    case "markdown":
      return markdownToHtml(raw, title);
    case "text":
      return textToHtml(raw, title);
    case "docx": {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.convertToHtml(
        { buffer },
        {
          styleMap: [
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Subtitle'] => h2:fresh",
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading1'] => h1:fresh",
            "p[style-name='Heading2'] => h2:fresh",
            "p[style-name='Heading3'] => h3:fresh",
            "p[style-name='heading 1'] => h1:fresh",
            "p[style-name='heading 2'] => h2:fresh",
            "p[style-name='heading 3'] => h3:fresh",
          ],
          convertImage: mammoth.images.imgElement(async (image) => {
            const type = image.contentType || "";
            if (!/^image\/(png|jpe?g|gif|webp|bmp)$/i.test(type)) {
              return { src: "" };
            }
            const b64 = (await image.read("base64")) as string;
            return { src: `data:${type};base64,${b64}` };
          }),
        }
      );
      return formatImportedHtml(value || `<h1>${escapeHtml(title)}</h1>`);
    }
    default:
      throw new Error("Unsupported document type");
  }
}
