/** Shared Doc research markup helpers (contentEditable-safe markers). */

export type CiteStyle = "apa" | "mla" | "chicago" | "ieee";

export function insertHtmlAtSelection(html: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const frag = document.createDocumentFragment();
  let node: ChildNode | null;
  let last: ChildNode | null = null;
  while ((node = temp.firstChild)) {
    last = frag.appendChild(node);
  }
  range.insertNode(frag);
  if (last) {
    range.setStartAfter(last);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  return true;
}

export function buildCiteSpan(opts: {
  sourceId: string;
  label: string;
  locator?: string;
  key?: string;
}): string {
  const loc = opts.locator ? ` data-locator="${escapeAttr(opts.locator)}"` : "";
  const key = opts.key ? ` data-bibtex-key="${escapeAttr(opts.key)}"` : "";
  return `<span class="shelf-cite" data-source-id="${escapeAttr(opts.sourceId)}"${loc}${key} contenteditable="false">${escapeHtml(opts.label)}</span>`;
}

export function buildFootnoteSup(id: string, n: number, note: string): string {
  return `<sup class="shelf-footnote" id="fnref-${escapeAttr(id)}" data-fn-id="${escapeAttr(id)}" data-note="${escapeAttr(note)}" contenteditable="false"><a href="#fn-${escapeAttr(id)}">${n}</a></sup>`;
}

export function ensureEndnotes(body: HTMLElement) {
  let ol = body.querySelector("ol.shelf-endnotes");
  if (!ol) {
    ol = document.createElement("ol");
    ol.className = "shelf-endnotes";
    const h = document.createElement("h2");
    h.textContent = "Notes";
    body.appendChild(h);
    body.appendChild(ol);
  }
  return ol as HTMLOListElement;
}

export function renumberFootnotes(body: HTMLElement) {
  const notes = [...body.querySelectorAll("sup.shelf-footnote")];
  const ol = ensureEndnotes(body);
  ol.innerHTML = "";
  notes.forEach((sup, i) => {
    const n = i + 1;
    const id = sup.getAttribute("data-fn-id") || `fn${n}`;
    const note = sup.getAttribute("data-note") || "";
    sup.setAttribute("data-fn-id", id);
    const a = sup.querySelector("a");
    if (a) {
      a.href = `#fn-${id}`;
      a.textContent = String(n);
    } else {
      sup.innerHTML = `<a href="#fn-${id}">${n}</a>`;
    }
    const li = document.createElement("li");
    li.id = `fn-${id}`;
    li.innerHTML = `${escapeHtml(note)} <a href="#fnref-${id}">↩</a>`;
    ol.appendChild(li);
  });
}

export function buildEquationSpan(latex: string): string {
  return `<span class="shelf-eq" data-latex="${escapeAttr(latex)}" contenteditable="false">\\(${escapeHtml(latex)}\\)</span>`;
}

export function buildFigureHtml(caption: string, id?: string): string {
  const fid = id || `fig-${Math.random().toString(36).slice(2, 8)}`;
  return `<figure class="shelf-figure" id="${escapeAttr(fid)}"><p>[Figure]</p><figcaption>Figure: ${escapeHtml(caption)}</figcaption></figure>`;
}

export function buildTableHtml(caption: string, id?: string): string {
  const tid = id || `tbl-${Math.random().toString(36).slice(2, 8)}`;
  return `<figure class="shelf-table" id="${escapeAttr(tid)}"><table><thead><tr><th>Column</th><th>Value</th></tr></thead><tbody><tr><td></td><td></td></tr></tbody></table><figcaption>Table: ${escapeHtml(caption)}</figcaption></figure>`;
}

export function buildXref(targetId: string, label: string): string {
  return `<a class="shelf-xref" href="#${escapeAttr(targetId)}" data-target="${escapeAttr(targetId)}">${escapeHtml(label)}</a>`;
}

export function buildGlossaryTerm(term: string, def: string): string {
  return `<dl class="shelf-glossary"><div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(def)}</dd></div></dl>`;
}

export function buildBibliographyShell(style: CiteStyle): string {
  return `<div class="shelf-bibliography" data-style="${style}" contenteditable="false"><h2>References</h2><div class="shelf-bib-entries"></div></div>`;
}

export function countDocStats(body: HTMLElement): {
  words: number;
  chars: number;
  readingMinutes: number;
} {
  const text = (body.innerText || "").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").filter(Boolean).length : 0;
  const chars = text.length;
  const readingMinutes = Math.max(1, Math.ceil(words / 200)) || 0;
  return { words, chars, readingMinutes: words === 0 ? 0 : readingMinutes };
}

export function outlineFromBody(
  body: HTMLElement
): Array<{ id: string; level: number; text: string; el: HTMLElement }> {
  const headings = [
    ...body.querySelectorAll("h1, h2, h3"),
  ] as HTMLElement[];
  return headings.map((el, i) => {
    if (!el.id) el.id = `sec-${i + 1}`;
    const level = Number(el.tagName.slice(1));
    return { id: el.id, level, text: (el.textContent || "").trim(), el };
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
