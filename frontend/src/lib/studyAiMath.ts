import katex from "katex";

export type MathSegment =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; display: boolean };

const MD_OUTER_FENCE = /^```(?:markdown|md)?\s*\n([\s\S]*)\n```\s*$/;

/** Models often wrap the whole answer in a fence, or put TeX in ```latex. */
export function unwrapOuterMarkdownFence(src: string): string {
  const s = src.replace(/\r\n/g, "\n").trim();
  const m = s.match(MD_OUTER_FENCE);
  return m ? m[1] : src.replace(/\r\n/g, "\n");
}

/**
 * Normalize TeX so the markdown parser sees display math as its own blocks
 * and inline $...$ can run on the rest.
 */
export function normalizeStudyMarkdown(src: string): string {
  let s = unwrapOuterMarkdownFence(src);

  s = s.replace(
    /```(?:latex|tex|math|katex)\s*\n([\s\S]*?)```/gi,
    (_m, body: string) => `\n\n$$\n${String(body).trim()}\n$$\n\n`
  );

  s = s.replace(
    /\\begin\{(equation|align|gather|multline|eqnarray)\*?\}([\s\S]*?)\\end\{\1\*?\}/g,
    (_m, env: string, body: string) =>
      `\n\n$$\n\\begin{${env}}${body}\\end{${env}}\n$$\n\n`
  );

  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_m, tex: string) => {
    return `\n\n$$\n${String(tex).trim()}\n$$\n\n`;
  });

  // Closing $$ without a matching opener (common in model output)
  s = s.replace(
    /^(.*\\[a-zA-Z].*)\$\$$/gm,
    (_m, tex: string) => `\n\n$$\n${String(tex).trim()}\n$$\n\n`
  );

  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex: string) => {
    return `\n\n$$\n${String(tex).trim()}\n$$\n\n`;
  });

  s = normalizeTryNextMarkdown(s);

  return s.replace(/\n{3,}/g, "\n\n");
}

/** Lift common model quirks so ### Try next renders as a callout, not raw markdown. */
export function normalizeTryNextMarkdown(src: string): string {
  let s = src;

  s = s.replace(
    /^[-*•]\s+#{1,4}\s*Try next:?\s*(.*)$/gim,
    (_m, rest: string) => {
      const body = rest.trim();
      return body ? `### Try next\n\n${body}` : "### Try next";
    }
  );

  s = s.replace(
    /^[-*•]\s+\*{0,2}Try next:?\*{0,2}\s*(.*)$/gim,
    (_m, rest: string) => {
      const body = rest.trim();
      return body ? `### Try next\n\n${body}` : "### Try next";
    }
  );

  s = s.replace(
    /^#{1,4}\s*Try next:?\s+(.+)$/gim,
    (_m, rest: string) => `### Try next\n\n${rest.trim()}`
  );

  s = s.replace(/^#{1,4}\s*Try next:?\s*$/gim, "### Try next");

  return s;
}

/** Skip KaTeX when a "math" block is actually leftover markdown. */
export function looksLikeTex(tex: string): boolean {
  const t = tex.trim();
  if (!t) return false;
  if (/^#{1,4}\s/m.test(t)) return false;
  if (/^[-*•]\s/m.test(t) && !/[\\^_{}]/.test(t)) return false;
  return /[\\^_{}]|\\[a-zA-Z]+/.test(t) || t.length < 120;
}

/** Split a line into text / inline math segments (supports $...$, \\(...\\), leftover $$). */
export function splitInlineMath(text: string): MathSegment[] {
  const out: MathSegment[] = [];
  let i = 0;

  const pushText = (value: string) => {
    if (value) out.push({ kind: "text", value });
  };

  while (i < text.length) {
    if (text.startsWith("\\(", i)) {
      const end = text.indexOf("\\)", i + 2);
      if (end !== -1) {
        const tex = text.slice(i + 2, end).trim();
        if (tex) out.push({ kind: "math", value: tex, display: false });
        i = end + 2;
        continue;
      }
    }
    if (text.startsWith("$$", i)) {
      const end = text.indexOf("$$", i + 2);
      if (end !== -1) {
        const tex = text.slice(i + 2, end).trim();
        if (tex) out.push({ kind: "math", value: tex, display: true });
        i = end + 2;
        continue;
      }
    }
    if (text[i] === "$") {
      const end = text.indexOf("$", i + 1);
      if (end !== -1 && !text.slice(i + 1, end).includes("\n")) {
        const tex = text.slice(i + 1, end).trim();
        if (tex) out.push({ kind: "math", value: tex, display: false });
        i = end + 1;
        continue;
      }
    }
    const nextParen = text.indexOf("\\(", i + 1);
    const nextDisplay = text.indexOf("$$", i + 1);
    const nextDollar = text.indexOf("$", i + 1);
    const candidates = [nextParen, nextDisplay, nextDollar].filter((n) => n >= 0);
    const next = candidates.length ? Math.min(...candidates) : text.length;
    pushText(text.slice(i, next));
    i = next;
  }

  return out.length ? out : [{ kind: "text", value: text }];
}

export function renderMathHtml(tex: string, display: boolean): string {
  const cleaned = tex.replace(/^\s*\$+|\$+\s*$/g, "").trim();
  if (!looksLikeTex(cleaned)) {
    return display
      ? `<pre>${escapeHtml(cleaned)}</pre>`
      : `<code>${escapeHtml(cleaned)}</code>`;
  }
  try {
    return katex.renderToString(cleaned, {
      displayMode: display,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
  } catch {
    return display
      ? `<pre>${escapeHtml(cleaned)}</pre>`
      : `<code>${escapeHtml(cleaned)}</code>`;
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline markdown (bold, code, links) + math → HTML for exports. */
export function inlineMarkdownToExportHtml(text: string): string {
  const parts: string[] = [];
  for (const seg of splitInlineMath(text)) {
    if (seg.kind === "math") {
      parts.push(renderMathHtml(seg.value, seg.display));
      continue;
    }
    const chunk = escapeHtml(seg.value)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        '<a href="$2">$1</a>'
      );
    parts.push(chunk);
  }
  return parts.join("");
}
