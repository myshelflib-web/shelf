import { describe, expect, it } from "vitest";
import {
  ensureStoredReadOnlyDocDocument,
  isReadOnlyDocHtml,
  needsReadOnlyDocConversion,
  wrapAsReadOnlyDocHtml,
} from "./readOnlyDocHtml.js";

const SAMPLE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Article 200</title>
</head>
<body>
<header class="doc-masthead shelf-doc-masthead"><h1>Title</h1></header>
<article class="shelf-generated"><p class="shelf-doc-intro">Intro</p></article>
</body>
</html>`;

describe("readOnlyDocHtml", () => {
  it("detects pages that need Doc conversion", () => {
    expect(needsReadOnlyDocConversion(SAMPLE)).toBe(true);
    expect(needsReadOnlyDocConversion(wrapAsReadOnlyDocHtml(SAMPLE))).toBe(
      false
    );
  });

  it("wraps body content as a read-only Doc while keeping the document shell", () => {
    const out = ensureStoredReadOnlyDocDocument(SAMPLE);
    expect(isReadOnlyDocHtml(out)).toBe(true);
    expect(out).toContain("<!DOCTYPE html>");
    expect(out).toContain("<title>Article 200</title>");
    expect(out).toContain('data-shelf-readonly="1"');
    expect(out).toContain("shelf-generated");
    expect(out).toContain("shelf-doc-intro");
    expect(ensureStoredReadOnlyDocDocument(out)).toBe(out);
  });
});
