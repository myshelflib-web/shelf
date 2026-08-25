import { Fragment, type ReactNode } from "react";
import { MermaidBlock } from "@/components/study-ai/MermaidBlock";
import {
  looksLikeTex,
  normalizeStudyMarkdown,
  renderMathHtml,
  splitInlineMath,
} from "@/lib/studyAiMath";

function MathSpan({
  tex,
  display,
}: {
  tex: string;
  display: boolean;
}) {
  const html = renderMathHtml(tex, display);
  return (
    <span
      className={display ? "study-ai-math-block" : "study-ai-math-inline"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let key = 0;

  for (const seg of splitInlineMath(text)) {
    if (seg.kind === "math") {
      nodes.push(
        <MathSpan key={key++} tex={seg.value} display={seg.display} />
      );
      continue;
    }

    const chunk = seg.value;
    const re =
      /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))|(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)/g;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(chunk)) !== null) {
      if (match.index > last) {
        nodes.push(
          <Fragment key={key++}>{chunk.slice(last, match.index)}</Fragment>
        );
      }
      if (match[1]) {
        nodes.push(
          <a
            key={key++}
            href={match[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] underline underline-offset-2"
          >
            {match[2]}
          </a>
        );
      } else if (match[4]) {
        nodes.push(
          <code key={key++} className="study-ai-code-inline">
            {match[4].slice(1, -1)}
          </code>
        );
      } else if (match[5]) {
        nodes.push(
          <strong
            key={key++}
            className="font-semibold text-[var(--text-primary)]"
          >
            {match[5].slice(2, -2)}
          </strong>
        );
      } else if (match[6] || match[7]) {
        const raw = match[6] ?? match[7]!;
        nodes.push(
          <em key={key++} className="italic">
            {raw.slice(1, -1)}
          </em>
        );
      }
      last = match.index + match[0].length;
    }
    if (last < chunk.length) {
      nodes.push(<Fragment key={key++}>{chunk.slice(last)}</Fragment>);
    }
  }

  return nodes;
}

type Block =
  | { type: "h2" | "h3" | "h4"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "p"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; lang: string; text: string }
  | { type: "math"; text: string; display: boolean };

function splitTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));
}

function parseBlocks(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  let i = 0;

  const flushList = () => {
    if (list?.items.length) blocks.push(list);
    list = null;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      i += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      flushList();
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", lang, text: codeLines.join("\n") });
      continue;
    }

    if (trimmed.startsWith("$$")) {
      flushList();
      if (trimmed.endsWith("$$") && trimmed.length > 4) {
        const text = trimmed.slice(2, -2).trim();
        if (looksLikeTex(text)) {
          blocks.push({ type: "math", display: true, text });
        } else {
          blocks.push({ type: "p", text: trimmed });
        }
        i += 1;
        continue;
      }
      const mathLines: string[] = [];
      if (trimmed.length > 2) mathLines.push(trimmed.slice(2));
      const start = i;
      i += 1;
      let closed = false;
      while (i < lines.length) {
        const row = lines[i].trim();
        if (row.endsWith("$$")) {
          if (row !== "$$") mathLines.push(row.replace(/\$\$$/, ""));
          closed = true;
          i += 1;
          break;
        }
        if (
          mathLines.length >= 24 ||
          /^#{1,4}\s/.test(row) ||
          /^(?:[-*•]|\d+\.)\s/.test(row)
        ) {
          break;
        }
        mathLines.push(lines[i]);
        i += 1;
      }
      const text = mathLines.join("\n").trim();
      if (closed && looksLikeTex(text)) {
        blocks.push({ type: "math", display: true, text });
        continue;
      }
      i = start;
      blocks.push({ type: "p", text: trimmed });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("\\[")) {
      flushList();
      if (trimmed.endsWith("\\]") && trimmed.length > 4) {
        blocks.push({
          type: "math",
          display: true,
          text: trimmed.slice(2, -2).trim(),
        });
        i += 1;
        continue;
      }
      const mathLines: string[] = [];
      if (trimmed.length > 2) mathLines.push(trimmed.slice(2));
      i += 1;
      while (i < lines.length && !lines[i].trim().endsWith("\\]")) {
        mathLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        const end = lines[i].trim();
        if (end !== "\\]") mathLines.push(end.replace(/\\]$/, ""));
        i += 1;
      }
      blocks.push({
        type: "math",
        display: true,
        text: mathLines.join("\n").trim(),
      });
      continue;
    }

    if (
      trimmed.includes("|") &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1].trim())
    ) {
      flushList();
      const headers = splitTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes("|")) {
        const row = splitTableRow(lines[i].trim());
        if (!isTableSeparator(lines[i].trim())) {
          rows.push(row);
        }
        i += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const h4 = trimmed.match(/^####\s+(.+)$/);
    const h3 = trimmed.match(/^###\s+(.+)$/);
    const h2 = trimmed.match(/^##\s+(.+)$/);
    const h1 = trimmed.match(/^#\s+(.+)$/);
    const ul = trimmed.match(/^[-*•]\s+(.+)$/);
    const ol = trimmed.match(/^\d+\.\s+(.+)$/);

    if (h4) {
      flushList();
      blocks.push({ type: "h4", text: h4[1] });
    } else if (h3) {
      flushList();
      blocks.push({ type: "h3", text: h3[1] });
    } else if (h2 || h1) {
      flushList();
      blocks.push({ type: "h2", text: (h2 ?? h1)![1] });
    } else if (ul) {
      if (list?.type !== "ul") {
        flushList();
        list = { type: "ul", items: [] };
      }
      list.items.push(ul[1]);
    } else if (ol) {
      if (list?.type !== "ol") {
        flushList();
        list = { type: "ol", items: [] };
      }
      list.items.push(ol[1]);
    } else {
      flushList();
      blocks.push({ type: "p", text: trimmed });
    }
    i += 1;
  }

  flushList();
  return blocks;
}

export function StudyAIContent({
  content,
  streaming = false,
}: {
  content: string;
  streaming?: boolean;
}) {
  const blocks = parseBlocks(normalizeStudyMarkdown(content));
  const last = blocks.length - 1;

  return (
    <div className="study-ai-prose">
      {blocks.map((block, i) => {
        const caret = streaming && i === last;
        switch (block.type) {
          case "h2":
            return <h2 key={i}>{renderInline(block.text)}</h2>;
          case "h3":
            return <h3 key={i}>{renderInline(block.text)}</h3>;
          case "h4":
            return <h4 key={i}>{renderInline(block.text)}</h4>;
          case "ul":
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={i} className="study-ai-table-wrap">
                <table>
                  <thead>
                    <tr>
                      {block.headers.map((h, j) => (
                        <th key={j}>{renderInline(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c}>{renderInline(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "math":
            return (
              <div key={i} className="study-ai-math-block">
                <MathSpan tex={block.text} display={block.display} />
              </div>
            );
          case "code": {
            const lang = block.lang.toLowerCase();
            const looksMermaid =
              lang === "mermaid" ||
              lang === "mmd" ||
              (!lang && /^\s*mindmap\b/m.test(block.text));
            if (looksMermaid) {
              return <MermaidBlock key={i} chart={block.text} />;
            }
            return (
              <pre key={i} className="study-ai-code-block">
                <code>{block.text}</code>
              </pre>
            );
          }
          default:
            return (
              <p key={i}>
                {renderInline(block.text)}
                {caret ? (
                  <span className="study-ai-stream-caret" aria-hidden />
                ) : null}
              </p>
            );
        }
      })}
      {streaming && blocks[last]?.type !== "p" ? (
        <span className="study-ai-stream-caret" aria-hidden />
      ) : null}
    </div>
  );
}
