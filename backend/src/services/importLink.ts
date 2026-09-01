import { parsePublicHttpUrl } from "../utils/publicUrl.js";
import { fetchWithRetry } from "../utils/fetchRetry.js";
import { TimeoutError } from "../utils/timeout.js";
import {
  PDF_IMPORT_MAX_BYTES,
  formatImportedHtml,
  escapeHtml,
} from "../utils/contentFiles.js";

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 25_000;
/** Cap HTML downloads well below PDF limit. */
const HTML_MAX_BYTES = 5 * 1024 * 1024;
const MIN_READABLE_CHARS = 80;
/** Real article body — not SPA chrome / nav-only shells. */
const MIN_ARTICLE_CHARS = 400;
const MIN_LONG_PARAS = 2;
const LONG_PARA_CHARS = 100;

export type ImportedDocument =
  | { kind: "pdf"; buffer: Buffer; finalUrl: string; titleHint?: string }
  | { kind: "html"; html: string; finalUrl: string; titleHint?: string };

export class ImportLinkError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ImportLinkError";
  }
}

const LOGIN_PATH =
  /\/(login|log-in|signin|sign-in|signup|sign-up|auth|oauth|sso|session|accounts\/login|users\/sign_in)(\/|$|\?)/i;

const LOGIN_PHRASES = [
  /sign\s*in\s*to\s*(continue|view|access|read|unlock)/i,
  /log\s*in\s*to\s*(continue|view|access|read|unlock)/i,
  /please\s+(sign|log)\s*in/i,
  /authentication\s+required/i,
  /create\s+an?\s+account\s+to\s+(continue|view|access|read)/i,
  /you\s+must\s+be\s+(signed|logged)\s+in/i,
  /members?\s+only/i,
  /subscribe\s+to\s+(continue|read|view)/i,
];

const BOT_WALL =
  /cf-browser-verification|challenge-platform|attention\s+required|just\s+a\s+moment|enable\s+javascript\s+and\s+cookies|access\s+denied|request\s+blocked/i;

function looksLikeLoginUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return LOGIN_PATH.test(u.pathname) || LOGIN_PATH.test(u.href);
  } catch {
    return false;
  }
}

function plainTextLength(html: string): number {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return undefined;
  const t = m[1]
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t || t.length > 200) return undefined;
  return t;
}

function paragraphTexts(html: string): string[] {
  return [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) =>
      m[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}

/**
 * Reject JS shells / nav chrome that look “full” but aren’t a readable article.
 * Exported for unit tests.
 */
export function detectNotIndexable(html: string): ImportLinkError | null {
  const plainLen = plainTextLength(html);
  const paras = paragraphTexts(html);
  const longParas = paras.filter((p) => p.length >= LONG_PARA_CHARS);

  const looksLikeSpaShell =
    /id=["'](root|__next|app|__nuxt)["']/i.test(html) &&
    longParas.length < MIN_LONG_PARAS;

  if (looksLikeSpaShell && plainLen < 2_500) {
    return new ImportLinkError(
      422,
      "not_indexable",
      "This page needs a browser to load (little readable article text). Keeping it as a linked embed — use Open, or paste into Study AI."
    );
  }

  if (plainLen < MIN_ARTICLE_CHARS || longParas.length < MIN_LONG_PARAS) {
    return new ImportLinkError(
      422,
      "not_indexable",
      "Not enough article text to save in Shelf. Keeping it as a linked embed — use Open, or paste into Study AI."
    );
  }

  return null;
}

/** Exported for unit tests. */
export function detectAccessBarrier(
  status: number,
  html: string,
  finalUrl: string
): ImportLinkError | null {
  if (status === 401 || status === 403) {
    return new ImportLinkError(
      403,
      "login_required",
      "This page requires sign-in or blocked the request. Open the link in a browser, or paste the text into Study AI."
    );
  }

  if (looksLikeLoginUrl(finalUrl)) {
    return new ImportLinkError(
      403,
      "login_required",
      "The site redirected to a login page. Shelf can only import publicly readable pages."
    );
  }

  const plainLen = plainTextLength(html);
  const hasPasswordField = /type\s*=\s*["']password["']/i.test(html);
  const loginHits = LOGIN_PHRASES.filter((re) => re.test(html)).length;

  if (BOT_WALL.test(html) && plainLen < 600) {
    return new ImportLinkError(
      403,
      "blocked",
      "The site blocked automated access (bot check or captcha). Open the page manually, or paste content into Study AI."
    );
  }

  if ((hasPasswordField || loginHits >= 1) && plainLen < 500) {
    return new ImportLinkError(
      403,
      "login_required",
      "This page looks like a sign-in or paywall gate. Shelf can only import publicly readable pages."
    );
  }

  if (loginHits >= 2 && plainLen < 1200) {
    return new ImportLinkError(
      403,
      "login_required",
      "This page looks like a sign-in or paywall gate. Shelf can only import publicly readable pages."
    );
  }

  return null;
}

async function readBodyLimited(
  res: Response,
  maxBytes: number
): Promise<Buffer> {
  const lenHeader = res.headers.get("content-length");
  if (lenHeader) {
    const n = Number(lenHeader);
    if (Number.isFinite(n) && n > maxBytes) {
      throw new ImportLinkError(
        413,
        "too_large",
        `File is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.`
      );
    }
  }

  if (!res.body) {
    const ab = await res.arrayBuffer();
    if (ab.byteLength > maxBytes) {
      throw new ImportLinkError(
        413,
        "too_large",
        `File is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.`
      );
    }
    return Buffer.from(ab);
  }

  const reader = res.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      throw new ImportLinkError(
        413,
        "too_large",
        `File is larger than ${Math.round(maxBytes / (1024 * 1024))} MB.`
      );
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function isPdfBuffer(buf: Buffer): boolean {
  return buf.subarray(0, 5).toString("latin1").startsWith("%PDF");
}

function contentTypeIsPdf(ct: string | null, url: string): boolean {
  const mime = (ct || "").split(";")[0].trim().toLowerCase();
  if (mime === "application/pdf") return true;
  try {
    const path = new URL(url).pathname.toLowerCase();
    return path.endsWith(".pdf");
  } catch {
    return false;
  }
}

function contentTypeIsHtml(ct: string | null): boolean {
  const mime = (ct || "").split(";")[0].trim().toLowerCase();
  return (
    !mime ||
    mime === "text/html" ||
    mime === "application/xhtml+xml" ||
    mime === "text/plain" ||
    mime.startsWith("text/")
  );
}

async function fetchFollowingRedirects(
  startUrl: string
): Promise<{ finalUrl: string; status: number; headers: Headers; body: Buffer }> {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safe = parsePublicHttpUrl(current);
    if (!safe) {
      throw new ImportLinkError(
        400,
        "invalid_url",
        "URL must be a public http(s) link (no local or private addresses)."
      );
    }

    let res: Response;
    try {
      res = await fetchWithRetry(safe, {
        method: "GET",
        redirect: "manual",
        timeoutMs: FETCH_TIMEOUT_MS,
        headers: {
          "User-Agent":
            "ShelfImporter/1.0 (personal study library; +https://shelf.app)",
          Accept:
            "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.8",
        },
      });
    } catch (err) {
      if (err instanceof TimeoutError) {
        throw new ImportLinkError(
          504,
          "timeout",
          "The site took too long to respond. Try again, or open the link and paste content into Study AI."
        );
      }
      throw new ImportLinkError(
        502,
        "fetch_failed",
        "Could not reach this URL. Check the link and try again."
      );
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) {
        throw new ImportLinkError(
          502,
          "bad_redirect",
          "The site returned a redirect without a destination."
        );
      }
      let next: string;
      try {
        next = new URL(loc, safe).toString();
      } catch {
        throw new ImportLinkError(
          502,
          "bad_redirect",
          "The site returned an invalid redirect."
        );
      }
      if (looksLikeLoginUrl(next)) {
        throw new ImportLinkError(
          403,
          "login_required",
          "The site redirected to a login page. Shelf can only import publicly readable pages."
        );
      }
      current = next;
      continue;
    }

    if (res.status === 404) {
      throw new ImportLinkError(
        404,
        "not_found",
        "Nothing was found at this URL (404)."
      );
    }

    if (res.status === 401 || res.status === 403) {
      throw new ImportLinkError(
        403,
        "login_required",
        "This page requires sign-in or blocked the request. Open the link in a browser, or paste the text into Study AI."
      );
    }

    if (res.status === 429) {
      throw new ImportLinkError(
        429,
        "rate_limited",
        "The site rate-limited the request. Wait a bit and try again."
      );
    }

    if (res.status < 200 || res.status >= 300) {
      throw new ImportLinkError(
        502,
        "http_error",
        `The site returned HTTP ${res.status}. Import only works for publicly readable pages.`
      );
    }

    // Allow PDF-sized downloads; HTML is rejected later if oversized text.
    const body = await readBodyLimited(res, PDF_IMPORT_MAX_BYTES);

    return {
      finalUrl: safe,
      status: res.status,
      headers: res.headers,
      body,
    };
  }

  throw new ImportLinkError(
    502,
    "too_many_redirects",
    "Too many redirects while fetching this URL."
  );
}

/**
 * Fetch a public URL and return PDF bytes or sanitized HTML for Shelf storage.
 */
export async function fetchRemoteDocument(url: string): Promise<ImportedDocument> {
  const start = parsePublicHttpUrl(url);
  if (!start) {
    throw new ImportLinkError(
      400,
      "invalid_url",
      "URL must be a public http(s) link (no local or private addresses)."
    );
  }

  const { finalUrl, status, headers, body } = await fetchFollowingRedirects(start);
  const ct = headers.get("content-type");

  if (isPdfBuffer(body) || contentTypeIsPdf(ct, finalUrl)) {
    if (!isPdfBuffer(body)) {
      throw new ImportLinkError(
        422,
        "invalid_pdf",
        "The response looked like a PDF but the file is not valid."
      );
    }
    if (body.length > PDF_IMPORT_MAX_BYTES) {
      throw new ImportLinkError(
        413,
        "too_large",
        "Imported PDF is too large to fetch into Shelf. Upload the file instead."
      );
    }
    return { kind: "pdf", buffer: body, finalUrl };
  }

  if (!contentTypeIsHtml(ct) && !isPdfBuffer(body)) {
    throw new ImportLinkError(
      422,
      "unsupported_type",
      `Unsupported content type${ct ? ` (${ct.split(";")[0].trim()})` : ""}. Import works for web pages and PDFs.`
    );
  }

  if (body.length > HTML_MAX_BYTES) {
    throw new ImportLinkError(
      413,
      "too_large",
      "Page HTML is larger than 5 MB after download."
    );
  }

  let htmlText: string;
  try {
    htmlText = body.toString("utf8");
  } catch {
    throw new ImportLinkError(
      422,
      "invalid_html",
      "Could not decode the page as text."
    );
  }

  const barrier = detectAccessBarrier(status, htmlText, finalUrl);
  if (barrier) throw barrier;

  const titleHint = extractTitle(htmlText);
  let cleaned = formatImportedHtml(htmlText);
  if (plainTextLength(cleaned) < MIN_READABLE_CHARS) {
    // Retry with a thin wrapper using title if body was empty-ish
    if (titleHint) {
      cleaned = formatImportedHtml(
        `<h1>${escapeHtml(titleHint)}</h1>${htmlText}`
      );
    }
  }

  if (plainTextLength(cleaned) < MIN_READABLE_CHARS) {
    throw new ImportLinkError(
      422,
      "not_indexable",
      "Almost no readable text was found. Keeping it as a linked embed — use Open, or paste into Study AI."
    );
  }

  const thin = detectNotIndexable(cleaned);
  if (thin) throw thin;

  return { kind: "html", html: cleaned, finalUrl, titleHint };
}

/**
 * Whether a third-party site allows embedding in a Shelf iframe.
 * Exported for unit tests.
 */
export function headersAllowEmbedding(headers: Headers): boolean {
  const xfo = (headers.get("x-frame-options") || "").trim().toLowerCase();
  if (xfo === "deny" || xfo === "sameorigin") return false;
  // ALLOW-FROM is obsolete; treat as blocking for our purposes if present alone
  if (xfo.startsWith("allow-from")) return false;

  const csp =
    headers.get("content-security-policy") ||
    headers.get("content-security-policy-report-only") ||
    "";
  const fa = csp.match(/frame-ancestors\s+([^;]+)/i);
  if (fa) {
    const sources = fa[1].trim().toLowerCase();
    if (!sources || sources === "'none'" || sources === "none") return false;
    // Any explicit frame-ancestors without * means Shelf (other origin) is blocked
    if (!sources.split(/\s+/).includes("*")) return false;
  }
  return true;
}

const EMBED_CHECK_TIMEOUT_MS = 12_000;

/**
 * Probe a public URL’s framing headers (does not download the full body).
 */
import { isKnownNonEmbedUrl } from "./linkEmbedPolicy.js";

export async function checkUrlEmbeddable(
  url: string
): Promise<{ embeddable: boolean; finalUrl: string }> {
  const start = parsePublicHttpUrl(url);
  if (!start) {
    return { embeddable: false, finalUrl: url };
  }
  if (isKnownNonEmbedUrl(start)) {
    return { embeddable: false, finalUrl: start };
  }

  let current = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const safe = parsePublicHttpUrl(current);
    if (!safe) return { embeddable: false, finalUrl: current };
    if (isKnownNonEmbedUrl(safe)) {
      return { embeddable: false, finalUrl: safe };
    }

    let res: Response;
    try {
      res = await fetchWithRetry(safe, {
        method: "GET",
        redirect: "manual",
        timeoutMs: EMBED_CHECK_TIMEOUT_MS,
        headers: {
          "User-Agent":
            "ShelfImporter/1.0 (personal study library; +https://shelf.app)",
          Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
          Range: "bytes=0-0",
        },
      });
    } catch {
      return { embeddable: false, finalUrl: safe };
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) return { embeddable: false, finalUrl: safe };
      try {
        current = new URL(loc, safe).toString();
      } catch {
        return { embeddable: false, finalUrl: safe };
      }
      // Drain/cancel body if any
      try {
        await res.body?.cancel();
      } catch {
        /* ignore */
      }
      continue;
    }

    const embeddable = headersAllowEmbedding(res.headers);
    try {
      await res.body?.cancel();
    } catch {
      /* ignore */
    }
    return { embeddable, finalUrl: safe };
  }

  return { embeddable: false, finalUrl: current };
}

