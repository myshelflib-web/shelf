import { truncateText } from "../utils/htmlText.js";

/** ~chars for page-ask material. Lower = faster/cheaper (free tier default ~6.5k). */
export const PAGE_ASK_CONTEXT_BUDGET = Number(
  process.env.PAGE_ASK_CONTEXT_BUDGET ?? 6_500
);

export type PackedPageAskContext = {
  selectionBlock: string;
  fileBlock: string;
  pageVectorBlock: string;
  relatedBlock: string;
  charsUsed: number;
};

function overlapRatio(a: string, b: string): number {
  const left = a.toLowerCase().replace(/\s+/g, " ").trim();
  const right = b.toLowerCase().replace(/\s+/g, " ").trim();
  if (!left || !right) return 0;
  if (right.includes(left.slice(0, Math.min(80, left.length)))) return 0.9;
  if (left.includes(right.slice(0, Math.min(80, right.length)))) return 0.9;
  const window = Math.min(60, left.length);
  let hits = 0;
  for (let i = 0; i + window <= left.length; i += Math.max(20, Math.floor(window / 2))) {
    if (right.includes(left.slice(i, i + window))) hits += 1;
  }
  return hits / Math.max(1, Math.ceil(left.length / Math.max(20, window / 2)));
}

/** Drop vector chunks that mostly repeat the highlight or already-kept text. */
export function dedupeAgainst(
  chunks: string[],
  anchors: string[],
  threshold = 0.45
): string[] {
  const kept: string[] = [];
  for (const chunk of chunks) {
    const against = [...anchors, ...kept];
    if (against.some((a) => overlapRatio(chunk, a) >= threshold)) continue;
    kept.push(chunk);
  }
  return kept;
}

/**
 * Pack highlight + full-file awareness + vectors into a fixed char budget.
 * Priority: selection → page vectors (rest of PDF) → short file scaffold → related library.
 */
export function packPageAskContext(opts: {
  selection?: string;
  fullFileText: string;
  pageChunks: string[];
  related: Array<{ title: string; notebook: string; topic: string; text: string }>;
  budget?: number;
}): PackedPageAskContext {
  const budget = opts.budget ?? PAGE_ASK_CONTEXT_BUDGET;
  let remaining = budget;

  const take = (text: string, max: number) => {
    const slice = truncateText(text.trim(), Math.min(max, Math.max(0, remaining)));
    remaining -= slice.length;
    return slice;
  };

  const hasSelection = Boolean(opts.selection?.trim());
  const selectionRaw = opts.selection?.trim() ?? "";

  // 1) Highlight first (cheap, high value).
  const selectionCap = hasSelection ? Math.min(1_800, Math.floor(budget * 0.18)) : 0;
  const selectionText = hasSelection ? take(selectionRaw, selectionCap) : "";
  const selectionBlock = selectionText
    ? `Primary focus (learner highlight):\n"""${selectionText}"""`
    : "";

  // 2) Page vectors = cheap way to cover the rest of the PDF.
  const pageCap = hasSelection
    ? Math.min(5_500, Math.floor(budget * 0.5))
    : Math.min(4_500, Math.floor(budget * 0.4));
  const pageUnique = dedupeAgainst(
    opts.pageChunks.map((c) => c.trim()).filter(Boolean),
    selectionText ? [selectionText] : [],
    0.5
  ).slice(0, hasSelection ? 6 : 8);
  const pageJoined = pageUnique
    .map((c, i) => `(p${i + 1}) ${truncateText(c, hasSelection ? 900 : 700)}`)
    .join("\n\n");
  const pageVectorText = pageJoined ? take(pageJoined, pageCap) : "";
  const pageVectorBlock = pageVectorText
    ? `Relevant passages from this file (covers the full document via retrieval):\n${pageVectorText}`
    : "";

  // 3) Thin full-file scaffold so the model still "sees" the document shape.
  //    Prefer vectors; only dump raw body for gaps / no-vector PDFs.
  const anchors = [
    selectionText,
    ...pageUnique,
  ].filter(Boolean);
  const fileCap = hasSelection
    ? Math.min(2_800, Math.floor(budget * 0.25))
    : Math.min(6_500, Math.max(2_000, remaining - 1_200));

  let fileText = "";
  const full = opts.fullFileText.trim();
  if (full && remaining > 400 && fileCap > 400) {
    const vectorsCoverWell = pageUnique.length >= (hasSelection ? 3 : 4);
    if (!vectorsCoverWell) {
      // Head + tail snapshot of the whole file (cheap complete-PDF signal).
      const half = Math.floor(fileCap / 2) - 20;
      if (full.length <= fileCap) {
        fileText = take(full, fileCap);
      } else {
        const head = full.slice(0, Math.max(200, half));
        const tail = full.slice(-Math.max(200, half));
        fileText = take(`${head}\n\n[…]\n\n${tail}`, fileCap);
      }
    } else if (!hasSelection) {
      // No highlight: fill leftover budget with body, skipping heavy overlap.
      const body = dedupeAgainst([full], anchors, 0.55)[0] ?? full;
      fileText = take(body, fileCap);
    } else {
      // Highlight + good vectors: tiny orientation only (title-adjacent head).
      fileText = take(full.slice(0, Math.min(900, fileCap)), Math.min(900, fileCap));
    }
  }
  const fileBlock = fileText
    ? `File content${hasSelection ? " (supporting — full PDF via head/passages)" : " (full file)"}:\n${fileText}`
    : "";

  // 4) Related library — persona memory across notebooks; keep short.
  const relatedParts: string[] = [];
  for (const r of opts.related.slice(0, hasSelection ? 2 : 3)) {
    if (remaining < 200) break;
    const line = `(r) ${r.title} — ${r.notebook}${r.topic ? ` / ${r.topic}` : ""}\n${truncateText(r.text, 450)}`;
    if (anchors.some((a) => overlapRatio(line, a) >= 0.55)) continue;
    const piece = take(line, Math.min(550, remaining));
    if (piece) relatedParts.push(piece);
  }
  const relatedBlock = relatedParts.length
    ? `Related notes from your library:\n${relatedParts.join("\n\n")}`
    : "";

  const charsUsed = budget - remaining;
  return {
    selectionBlock,
    fileBlock,
    pageVectorBlock,
    relatedBlock,
    charsUsed,
  };
}

export function joinPackedContext(packed: PackedPageAskContext): string {
  return [
    packed.selectionBlock,
    packed.fileBlock,
    packed.pageVectorBlock,
    packed.relatedBlock,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Title-only / scanned PDFs — not enough text to tutor from. */
export function isThinPageText(title: string, body: string): boolean {
  const t = title.trim().toLowerCase();
  const b = body.replace(/\s+/g, " ").trim();
  if (!b) return true;
  if (b.length < 80) return true;
  if (t && b.toLowerCase() === t) return true;
  if (t && b.toLowerCase().startsWith(t) && b.length < t.length + 40) return true;
  return false;
}
