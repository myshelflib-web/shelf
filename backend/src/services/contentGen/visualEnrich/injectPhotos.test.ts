import { describe, expect, it } from "vitest";
import {
  buildPhotoFigure,
  injectPhotoIntoHtml,
  isVisuallyEnriched,
} from "./injectPhotos.js";

const SAMPLE_HTML = `<!DOCTYPE html><html><body><article class="shelf-generated">
<p class="shelf-doc-intro">Intro.</p>
<section class="shelf-doc-section"><h2>One</h2><p>Body.</p></section>
</article></body></html>`;

describe("injectPhotos", () => {
  it("detects enriched pages", () => {
    expect(isVisuallyEnriched(SAMPLE_HTML)).toBe(false);
    expect(
      isVisuallyEnriched(
        SAMPLE_HTML.replace(
          "shelf-generated",
          'shelf-generated" data-visual-enrich="openverse'
        )
      )
    ).toBe(true);
  });

  it("injects a figure after the first section", () => {
    const figure = buildPhotoFigure({
      src: "https://api.test/media/figure-1.jpg",
      alt: "Heart",
      caption: "Heart anatomy",
      creditLine: "Author · CC BY via Openverse",
      sourceUrl: "https://openverse.org",
    });
    const out = injectPhotoIntoHtml(SAMPLE_HTML, figure);
    expect(out).toContain("shelf-photo");
    expect(out).toContain("data-visual-enrich");
    expect(out.indexOf("</section>")).toBeLessThan(out.indexOf("shelf-photo"));
  });
});
