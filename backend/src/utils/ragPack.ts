import { truncateText } from "./htmlText.js";
import type { RankedExcerpt } from "./ragFusion.js";

export const LIBRARY_CONTEXT_BUDGET = Number(
  process.env.LIBRARY_CONTEXT_BUDGET ?? 8_000
);

export type LibraryCitation = {
  n: number;
  pageId: string;
  title: string;
  notebook: string;
  topic: string;
  href: string;
  quote: string;
};

export function compactHistory<
  T extends { role: string; content: string; imageBase64?: string },
>(history: T[] | undefined, limit: number): T[] {
  const sliced = (history ?? []).slice(-limit);
  return sliced.map((m, i) => {
    const isOldAssistant = m.role === "assistant" && i < sliced.length - 2;
    if (isOldAssistant && m.content.length > 1400) {
      return { ...m, content: truncateText(m.content, 1400) };
    }
    return m;
  });
}

export function packLibraryExcerpts(
  excerpts: RankedExcerpt[],
  budget = LIBRARY_CONTEXT_BUDGET
): { numbered: string; citations: LibraryCitation[]; used: number } {
  const citations: LibraryCitation[] = [];
  const blocks: string[] = [];
  let remaining = budget;

  excerpts.forEach((ex, i) => {
    if (remaining < 180) return;
    const cap = Math.min(1_400, remaining);
    const text = truncateText(ex.text, cap);
    remaining -= text.length;
    const n = citations.length + 1;
    citations.push({
      n,
      pageId: ex.pageId,
      title: ex.title,
      notebook: ex.notebook,
      topic: ex.topic,
      href: ex.href,
      quote: truncateText(text, 280),
    });
    blocks.push(
      `[${n}] ${ex.title} — ${ex.notebook}${ex.topic ? ` / ${ex.topic}` : ""} (relevance ${ex.score.toFixed(2)})\n${text}`
    );
    void i;
  });

  return {
    numbered: blocks.join("\n\n"),
    citations,
    used: budget - remaining,
  };
}

export function mergeCitations(
  primary: LibraryCitation[],
  extra: LibraryCitation[]
): LibraryCitation[] {
  const byPage = new Map<string, LibraryCitation>();
  for (const c of [...primary, ...extra]) {
    const prev = byPage.get(c.pageId);
    if (!prev) {
      byPage.set(c.pageId, { ...c });
      continue;
    }
    if (c.quote.length > prev.quote.length) prev.quote = c.quote;
  }
  return [...byPage.values()].map((c, i) => ({ ...c, n: i + 1 }));
}
