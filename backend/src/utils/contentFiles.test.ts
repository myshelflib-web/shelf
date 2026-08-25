import { describe, expect, it } from "vitest";
import {
  detectFileKind,
  extractReadableHtml,
  formatImportedHtml,
  markdownToHtml,
  sanitizeStoredHtml,
  validateUploadBuffer,
} from "./contentFiles.js";

describe("detectFileKind", () => {
  it("allows pdf, txt, md, and docx", () => {
    expect(detectFileKind("notes.pdf", "application/pdf")).toBe("pdf");
    expect(detectFileKind("notes.txt", "text/plain")).toBe("text");
    expect(detectFileKind("notes.md", "text/markdown")).toBe("markdown");
    expect(
      detectFileKind(
        "notes.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe("docx");
  });

  it("rejects html and other injectable types", () => {
    expect(detectFileKind("page.html", "text/html")).toBeNull();
    expect(detectFileKind("page.htm", "text/html")).toBeNull();
    expect(detectFileKind("icon.svg", "image/svg+xml")).toBeNull();
    expect(detectFileKind("data.xml", "application/xml")).toBeNull();
    expect(detectFileKind("old.doc", "application/msword")).toBeNull();
    expect(detectFileKind("run.js", "text/javascript")).toBeNull();
  });

  it("rejects mismatched mime types", () => {
    expect(detectFileKind("notes.pdf", "text/html")).toBeNull();
  });
});

describe("validateUploadBuffer", () => {
  it("requires a PDF magic header", () => {
    expect(validateUploadBuffer("pdf", Buffer.from("not a pdf"))).toMatch(
      /not a valid PDF/
    );
    expect(validateUploadBuffer("pdf", Buffer.from("%PDF-1.4"))).toBeNull();
  });

  it("rejects html disguised as text", () => {
    expect(
      validateUploadBuffer(
        "text",
        Buffer.from("<!DOCTYPE html><html><script>x</script></html>")
      )
    ).not.toBeNull();
  });
});

describe("sanitizeStoredHtml", () => {
  it("strips scripts, handlers, and javascript urls", () => {
    const out = sanitizeStoredHtml(
      `<p onclick="alert(1)">ok</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src="x" onerror="alert(1)" />`
    );
    expect(out).not.toMatch(/script|onclick|javascript:|onerror/i);
    expect(out).toContain("<p>ok</p>");
  });

  it("keeps blank-page text boxes and ink", () => {
    const html = `<div class="shelf-blank-canvas" data-w="4800" data-h="6400" style="width: 4800px; height: 6400px;"><div class="shelf-blank-textboxes"><div class="shelf-text-box" data-id="tb-a" data-x="2200" data-y="3000" data-w="400" style="left: 2200px; top: 3000px; width: 400px;"><p>Hello notes</p></div></div><svg class="blank-draw-layer" width="4800" height="6400" viewBox="0 0 4800 6400"><path class="blank-draw-stroke" d="M 2100.0 3100.0 L 2300.0 3120.0" fill="none" stroke="#dc2626" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>`;
    const out = sanitizeStoredHtml(html);
    expect(out).toContain("shelf-blank-canvas");
    expect(out).toContain("Hello notes");
    expect(out).toContain("blank-draw-layer");
    expect(out).toContain("M 2100.0 3100.0 L 2300.0 3120.0");
    expect(out).toContain("#dc2626");
  });

  it("keeps blank-page canvas background", () => {
    const html = `<div class="shelf-blank-canvas" data-w="4800" data-h="6400" data-bg="#0c0c0d" data-bg-tone="dark" style="width: 4800px; height: 6400px; background-color: #0c0c0d; color: #ececee;"><div class="shelf-blank-textboxes"></div><svg class="blank-draw-layer" width="4800" height="6400" viewBox="0 0 4800 6400"></svg></div>`;
    const out = sanitizeStoredHtml(html);
    expect(out).toContain('data-bg="#0c0c0d"');
    expect(out).toContain('data-bg-tone="dark"');
    expect(out).toContain("background-color: #0c0c0d");
    expect(out).toContain("color: #ececee");
  });
});

describe("extractReadableHtml", () => {
  it("takes body contents from a full document", () => {
    const html = `<!DOCTYPE html><html><head><style>body{color:red}</style><title>x</title></head><body><h1>Hi</h1><p>There</p></body></html>`;
    expect(extractReadableHtml(html)).toBe("<h1>Hi</h1><p>There</p>");
  });

  it("strips scripts", () => {
    expect(extractReadableHtml(`<p>ok</p><script>alert(1)</script>`)).toBe(
      "<p>ok</p>"
    );
  });
});

describe("formatImportedHtml", () => {
  it("promotes the first paragraph to a title", () => {
    const out = formatImportedHtml(
      "<p>Paper Title</p><p>A. Author</p><p>This abstract is a long paragraph that should not live in the masthead because it is clearly body copy rather than a header line.</p>"
    );
    expect(out).toContain("<h1>Paper Title</h1>");
    expect(out).toContain('class="doc-masthead"');
    expect(out).toContain("This abstract");
  });
});

describe("markdownToHtml", () => {
  it("escapes raw html in markdown", () => {
    const out = markdownToHtml("<script>alert(1)</script>\n\nHello", "T");
    expect(out).not.toMatch(/<script/i);
    expect(out).toContain("Hello");
  });
});
