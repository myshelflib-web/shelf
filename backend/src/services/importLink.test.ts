import { describe, expect, it } from "vitest";
import {
  detectAccessBarrier,
  detectNotIndexable,
  headersAllowEmbedding,
  ImportLinkError,
} from "./importLink.js";

describe("detectAccessBarrier", () => {
  it("flags 401/403 as login_required", () => {
    const err = detectAccessBarrier(401, "<html></html>", "https://example.com/a");
    expect(err).toBeInstanceOf(ImportLinkError);
    expect(err?.code).toBe("login_required");
  });

  it("flags login redirect URLs", () => {
    const err = detectAccessBarrier(
      200,
      "<html><body>Welcome</body></html>",
      "https://example.com/login?next=/article"
    );
    expect(err?.code).toBe("login_required");
  });

  it("flags thin pages with password fields", () => {
    const html = `
      <html><body>
        <h1>Sign in to continue</h1>
        <form><input type="password" name="pw" /></form>
      </body></html>`;
    const err = detectAccessBarrier(200, html, "https://example.com/article");
    expect(err?.code).toBe("login_required");
  });

  it("flags bot / captcha walls with little text", () => {
    const html = `<html><body class="cf-browser-verification">Just a moment...</body></html>`;
    const err = detectAccessBarrier(200, html, "https://example.com/x");
    expect(err?.code).toBe("blocked");
  });

  it("allows a normal article", () => {
    const paras = Array.from({ length: 20 }, (_, i) =>
      `<p>Paragraph ${i} with enough study material about history and polity for the exam.</p>`
    ).join("");
    const html = `<html><head><title>Article</title></head><body><h1>History</h1>${paras}</body></html>`;
    expect(detectAccessBarrier(200, html, "https://example.com/history")).toBeNull();
  });
});

describe("detectNotIndexable", () => {
  it("rejects thin SPA shells", () => {
    const html = `<div id="root"><nav>Home About</nav><p>Short</p></div>`;
    const err = detectNotIndexable(html);
    expect(err?.code).toBe("not_indexable");
  });

  it("rejects pages without enough long paragraphs", () => {
    const html = `<p>Hi</p><p>There</p><div>${"word ".repeat(100)}</div>`;
    expect(detectNotIndexable(html)?.code).toBe("not_indexable");
  });

  it("allows a readable article body", () => {
    const p =
      "<p>This paragraph has more than enough characters about Indian polity, the constitution, and federal structure for indexing into Shelf properly for study.</p>";
    const html = `<article><h1>Polity</h1>${p}${p}${p}</article>`;
    expect(detectNotIndexable(html)).toBeNull();
  });
});

describe("headersAllowEmbedding", () => {
  it("blocks X-Frame-Options DENY / SAMEORIGIN", () => {
    expect(
      headersAllowEmbedding(new Headers({ "x-frame-options": "DENY" }))
    ).toBe(false);
    expect(
      headersAllowEmbedding(new Headers({ "x-frame-options": "SAMEORIGIN" }))
    ).toBe(false);
  });

  it("blocks CSP frame-ancestors without *", () => {
    expect(
      headersAllowEmbedding(
        new Headers({
          "content-security-policy": "frame-ancestors 'self'",
        })
      )
    ).toBe(false);
  });

  it("allows missing framing headers", () => {
    expect(headersAllowEmbedding(new Headers())).toBe(true);
  });
});
