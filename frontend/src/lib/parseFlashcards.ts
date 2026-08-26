export type Flashcard = { front: string; back: string };

function cleanSide(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^[#>\-\*\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse Study AI flashcard markdown into front/back pairs.
 * Supports bold Q/A labels, Front/Back, and ### Card blocks.
 */
export function parseFlashcards(markdown: string): Flashcard[] {
  const text = markdown.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const cards: Flashcard[] = [];
  const pairRe =
    /(?:^|\n)\s*(?:\*\*)?(?:Q|Front|Question)(?:\*\*)?\s*[:：]\s*([\s\S]*?)(?:\n)\s*(?:\*\*)?(?:A|Back|Answer)(?:\*\*)?\s*[:：]\s*([\s\S]*?)(?=(?:\n\s*(?:\*\*)?(?:Q|Front|Question)(?:\*\*)?\s*[:：])|(?:\n\s*#{1,3}\s)|$)/gi;

  let m: RegExpExecArray | null;
  while ((m = pairRe.exec(text)) !== null) {
    const front = cleanSide(m[1]);
    const back = cleanSide(m[2]);
    if (front && back) cards.push({ front, back });
  }

  if (cards.length >= 2) return cards.slice(0, 40);

  // Fallback: numbered list "1. Q — A" or "1. Q / A"
  const lineRe =
    /^\s*(?:\d+[.)]\s+|[-*]\s+)(.+?)\s*(?:—+|–+|:+|\/)\s+(.+)\s*$/gm;
  while ((m = lineRe.exec(text)) !== null) {
    const front = cleanSide(m[1]);
    const back = cleanSide(m[2]);
    if (front && back && front.length < 280 && back.length < 600) {
      cards.push({ front, back });
    }
  }

  return cards.slice(0, 40);
}

export function flashcardsToMarkdown(cards: Flashcard[], title = "Flashcards"): string {
  const lines = [`# ${title}`, ""];
  cards.forEach((c, i) => {
    lines.push(`### Card ${i + 1}`);
    lines.push(`**Q:** ${c.front}`);
    lines.push(`**A:** ${c.back}`);
    lines.push("");
  });
  return lines.join("\n").trim() + "\n";
}

export function hasFlashcardDeck(markdown: string): boolean {
  return parseFlashcards(markdown).length >= 2;
}
