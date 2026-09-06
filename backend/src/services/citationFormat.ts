export type CiteStyle = "apa" | "mla" | "chicago" | "ieee";

export type CiteAuthor = { family?: string; given?: string; literal?: string };

export type CiteInput = {
  id: string;
  title: string;
  authors: CiteAuthor[];
  year?: string | null;
  container?: string | null;
  pages?: string | null;
  doi?: string | null;
  url?: string | null;
  type?: string | null;
  bibtexKey?: string | null;
  locator?: string | null;
};

function authorFamily(a: CiteAuthor): string {
  if (a.literal) return a.literal;
  return (a.family || a.given || "Unknown").trim();
}

function authorGivenFamily(a: CiteAuthor): string {
  if (a.literal) return a.literal;
  const g = (a.given || "").trim();
  const f = (a.family || "").trim();
  if (f && g) return `${f}, ${g}`;
  return f || g || "Unknown";
}

function authorList(
  authors: CiteAuthor[],
  style: CiteStyle
): string {
  if (!authors.length) return "Anonymous";
  const names =
    style === "mla" || style === "chicago"
      ? authors.map(authorGivenFamily)
      : authors.map((a, i) =>
          i === 0 ? authorGivenFamily(a) : authorFamily(a)
        );
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  if (style === "ieee") {
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
  }
  return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
}

function yearOf(s: CiteInput): string {
  return (s.year || "n.d.").toString();
}

function locatorSuffix(locator?: string | null): string {
  const loc = (locator || "").trim();
  if (!loc) return "";
  if (/^p\.?\s*/i.test(loc) || /^pp\.?\s*/i.test(loc)) return `, ${loc}`;
  if (/^\d/.test(loc)) return `, p. ${loc}`;
  return `, ${loc}`;
}

/** Parenthetical / numeric in-text citation. */
export function formatInText(
  sources: CiteInput[],
  style: CiteStyle
): string {
  if (sources.length === 0) return "";
  if (style === "ieee") {
    // Caller supplies index; here use placeholder numbers by order
    return sources
      .map((s, i) => `[${i + 1}${locatorSuffix(s.locator).replace(/^,/, "")}]`)
      .join("");
  }
  return `(${sources
    .map((s) => {
      if (style === "mla") {
        return `${authorFamily(s.authors[0] || {})}${locatorSuffix(s.locator)}`;
      }
      if (style === "chicago") {
        return `${authorFamily(s.authors[0] || {})} ${yearOf(s)}${locatorSuffix(s.locator)}`;
      }
      return `${authorFamily(s.authors[0] || {})}, ${yearOf(s)}${locatorSuffix(s.locator)}`;
    })
    .join("; ")})`;
}

export function formatBibliographyEntry(
  s: CiteInput,
  style: CiteStyle,
  index = 1
): string {
  const authors = authorList(s.authors, style);
  const year = yearOf(s);
  const title = s.title.trim() || "Untitled";
  const container = (s.container || "").trim();
  const pages = (s.pages || "").trim();
  const doi = (s.doi || "").trim();
  const url = (s.url || "").trim();
  const link = doi ? `https://doi.org/${doi.replace(/^https?:\/\/doi\.org\//i, "")}` : url;

  if (style === "ieee") {
    const bits = [`[${index}] ${authors}, “${title},”`];
    if (container) bits.push(` ${container},`);
    if (pages) bits.push(` pp. ${pages},`);
    bits.push(` ${year}.`);
    if (link) bits.push(` ${link}`);
    return bits.join("").replace(/\s+/g, " ").trim();
  }
  if (style === "mla") {
    const bits = [`${authors}. “${title}.”`];
    if (container) bits.push(` <em>${container}</em>,`);
    bits.push(` ${year}`);
    if (pages) bits.push(`, pp. ${pages}`);
    bits.push(".");
    if (link) bits.push(` ${link}`);
    return bits.join("").replace(/\s+/g, " ").trim();
  }
  if (style === "chicago") {
    const bits = [`${authors}. ${year}. “${title}.”`];
    if (container) bits.push(` <em>${container}</em>`);
    if (pages) bits.push(` ${pages}`);
    bits.push(".");
    if (link) bits.push(` ${link}`);
    return bits.join("").replace(/\s+/g, " ").trim();
  }
  // APA
  const bits = [`${authors} (${year}). ${title}.`];
  if (container) bits.push(` <em>${container}</em>.`);
  if (pages) bits.push(` ${pages}.`);
  if (link) bits.push(` ${link}`);
  return bits.join("").replace(/\s+/g, " ").trim();
}

export function formatBibliography(
  sources: CiteInput[],
  style: CiteStyle
): string {
  const sorted = [...sources].sort((a, b) =>
    authorFamily(a.authors[0] || {}).localeCompare(
      authorFamily(b.authors[0] || {})
    )
  );
  return sorted
    .map((s, i) => formatBibliographyEntry(s, style, i + 1))
    .join("\n");
}
