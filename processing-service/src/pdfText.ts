/** Fix spaced-letter PDF artifacts and merge broken lines. */
export function normalizePdfText(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // "S c h o o l" or "Sch ool" -> "School"
  text = text.replace(
    /\b([A-Za-z])(?:\s+[A-Za-z]){1,}\b/g,
    (match) => match.replace(/\s+/g, "")
  );

  // "Perce ntage", "Credi t" -> joined when second part continues a word
  text = text.replace(/\b([A-Za-z]{2,})\s+([a-z]{2,})\b/g, (full, a, b) => {
    if (/[a-zA-Z]$/.test(a) && /^[a-z]/.test(b)) return `${a}${b}`;
    return full;
  });

  text = text.replace(/[ \t]+/g, " ");

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const merged: string[] = [];
  for (const line of lines) {
    if (merged.length === 0) {
      merged.push(line);
      continue;
    }
    const prev = merged[merged.length - 1];
    const continues =
      !/[.!?:;)]$/.test(prev) &&
      /^[a-z(0-9]/.test(line) &&
      !/^[A-Z][A-Z\s&\-:()]{3,}$/.test(line);

    if (continues && prev.length < 120) {
      merged[merged.length - 1] = `${prev} ${line}`;
    } else {
      merged.push(line);
    }
  }

  return merged.join("\n");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function textToHtml(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const htmlParts: string[] = [];
  let inList = false;

  for (const line of lines) {
    if (/^\d+\.\s/.test(line) && line.length < 120) {
      if (inList) {
        htmlParts.push("</ul>");
        inList = false;
      }
      htmlParts.push(`<h2>${escapeHtml(line)}</h2>`);
    } else if (/^[A-Z][A-Z0-9\s&\-:()]+$/.test(line) && line.length < 80) {
      if (inList) {
        htmlParts.push("</ul>");
        inList = false;
      }
      htmlParts.push(`<h2>${escapeHtml(line)}</h2>`);
    } else if (/^[-•*]\s/.test(line) || /^\d+\)\s/.test(line)) {
      if (!inList) {
        htmlParts.push("<ul>");
        inList = true;
      }
      htmlParts.push(
        `<li>${escapeHtml(line.replace(/^[-•*]\s|^\d+\)\s/, ""))}</li>`
      );
    } else {
      if (inList) {
        htmlParts.push("</ul>");
        inList = false;
      }
      htmlParts.push(`<p>${escapeHtml(line)}</p>`);
    }
  }

  if (inList) htmlParts.push("</ul>");
  return htmlParts.join("\n");
}

export function extractTableOfContents(
  html: string
): Array<{ id: string; title: string }> {
  const headings: Array<{ id: string; title: string }> = [];
  const regex = /<h2>(.*?)<\/h2>/g;
  let match;
  let index = 1;
  while ((match = regex.exec(html)) !== null) {
    const title = match[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    headings.push({ id: `section-${index}`, title });
    index++;
  }
  return headings;
}
