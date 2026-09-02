/** True when Phase 2a already injected at least one photo. */
export function isVisuallyEnriched(html: string): boolean {
  return /data-visual-enrich=/i.test(html) || /class="[^"]*shelf-photo/i.test(html);
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPhotoFigure(opts: {
  src: string;
  alt: string;
  caption: string;
  creditLine: string;
  sourceUrl: string;
}): string {
  const source = opts.sourceUrl
    ? `<a href="${esc(opts.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a>`
    : "";
  return `<figure class="shelf-photo">
<img src="${esc(opts.src)}" alt="${esc(opts.alt)}" loading="lazy" decoding="async" />
<figcaption class="shelf-photo__caption">${esc(opts.caption)}</figcaption>
<p class="shelf-photo__credit">${esc(opts.creditLine)}${source ? ` · ${source}` : ""}</p>
</figure>`;
}

/** Inserts the figure after the first body section (or after intro if no sections). */
export function injectPhotoIntoHtml(html: string, figureHtml: string): string {
  if (isVisuallyEnriched(html)) return html;

  let out = html;
  if (/<article class="shelf-generated"/i.test(out)) {
    out = out.replace(
      /<article class="shelf-generated"/i,
      '<article class="shelf-generated" data-visual-enrich="openverse"'
    );
  }

  const sectionEnd = /<\/section>/i.exec(out);
  if (sectionEnd && sectionEnd.index !== undefined) {
    const idx = sectionEnd.index + sectionEnd[0].length;
    return out.slice(0, idx) + figureHtml + out.slice(idx);
  }

  const introEnd = /<p class="shelf-doc-intro">[\s\S]*?<\/p>/i.exec(out);
  if (introEnd && introEnd.index !== undefined) {
    const idx = introEnd.index + introEnd[0].length;
    return out.slice(0, idx) + figureHtml + out.slice(idx);
  }

  const bodyOpen = /<body>/i.exec(out);
  if (bodyOpen && bodyOpen.index !== undefined) {
    const idx = bodyOpen.index + bodyOpen[0].length;
    return out.slice(0, idx) + figureHtml + out.slice(idx);
  }

  return figureHtml + out;
}
