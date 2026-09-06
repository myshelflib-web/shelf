import type { CiteAuthor } from "./citationFormat.js";

export type ParsedBibEntry = {
  bibtexKey: string;
  type: string;
  title: string;
  authors: CiteAuthor[];
  year?: string;
  doi?: string;
  url?: string;
  container?: string;
  pages?: string;
};

function unbrace(v: string): string {
  return v
    .replace(/^[{"]/, "")
    .replace(/[}"]$/, "")
    .replace(/[{}]/g, "")
    .trim();
}

function parseAuthors(raw: string): CiteAuthor[] {
  return raw
    .split(/\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.includes(",")) {
        const [family, given] = part.split(",").map((s) => s.trim());
        return { family, given };
      }
      const bits = part.split(/\s+/);
      if (bits.length === 1) return { family: bits[0] };
      return {
        given: bits.slice(0, -1).join(" "),
        family: bits[bits.length - 1],
      };
    });
}

/** Minimal BibTeX parser for common @article/@book/@misc fields. */
export function parseBibtex(input: string): ParsedBibEntry[] {
  const text = input.replace(/\r\n/g, "\n");
  const entries: ParsedBibEntry[] = [];
  const re = /@(\w+)\s*\{\s*([^,]+)\s*,([\s\S]*?)\n\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const type = m[1]!.toLowerCase();
    const bibtexKey = m[2]!.trim();
    const body = m[3]!;
    const fields: Record<string, string> = {};
    const fieldRe = /(\w+)\s*=\s*(\{[^{}]*\}|"[^"]*"|[^,]+)\s*,?/g;
    let fm: RegExpExecArray | null;
    while ((fm = fieldRe.exec(body))) {
      fields[fm[1]!.toLowerCase()] = unbrace(fm[2]!.trim());
    }
    const title = fields.title || bibtexKey;
    const authors = fields.author ? parseAuthors(fields.author) : [];
    entries.push({
      bibtexKey,
      type,
      title,
      authors,
      year: fields.year,
      doi: fields.doi,
      url: fields.url || fields.howpublished,
      container: fields.journal || fields.booktitle || fields.publisher,
      pages: fields.pages,
    });
  }
  return entries;
}

export function parseCslJson(input: string): ParsedBibEntry[] {
  const raw = JSON.parse(input) as unknown;
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((item, i) => {
    const o = item as Record<string, unknown>;
    const authorRaw = (o.author as Array<Record<string, string>>) || [];
    const authors: CiteAuthor[] = authorRaw.map((a) => ({
      family: a.family,
      given: a.given,
      literal: a.literal,
    }));
    const issued = o.issued as { "date-parts"?: number[][] } | undefined;
    const year =
      issued?.["date-parts"]?.[0]?.[0]?.toString() ||
      (typeof o.year === "string" || typeof o.year === "number"
        ? String(o.year)
        : undefined);
    return {
      bibtexKey: String(o.id || o["citation-key"] || `csl${i + 1}`),
      type: String(o.type || "article"),
      title: String(o.title || "Untitled"),
      authors,
      year,
      doi: o.DOI ? String(o.DOI) : o.doi ? String(o.doi) : undefined,
      url: o.URL ? String(o.URL) : o.url ? String(o.url) : undefined,
      container: o["container-title"]
        ? String(o["container-title"])
        : undefined,
      pages: o.page ? String(o.page) : undefined,
    };
  });
}
