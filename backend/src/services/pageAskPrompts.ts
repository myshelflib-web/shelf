import { StudyGoal } from "@prisma/client";
import { pageAskSystemPrompt } from "./goalPrompt.js";
import type { StudyDepth } from "./studyDepth.js";

type PageAskMode =
  | "ask"
  | "summarize"
  | "notes"
  | "mindmap"
  | "deep-summary"
  | "analyze";

export function mergeInstructionForMode(mode: PageAskMode): string {
  if (mode === "deep-summary") {
    return `Create a comprehensive chapter-by-chapter deep summary of this document.
Use ## Deep summary, then ### per major section/chapter with detailed bullets, definitions, examples, and a ### Cross-cutting themes section.
Target 1,500+ words — thorough and dense, no filler.`;
  }
  if (mode === "summarize") {
    return `Summarize this file for revision. Use ## Summary, then ### Key points (detailed), ### Chapter notes, and ### Recap.
Cover every major theme from the section summaries.`;
  }
  if (mode === "notes") {
    return `Create thorough revision notes. Use ## Notes, ### Key terms, ### Must remember, and ### Chapter-wise bullets.
Be complete — not a short cheat sheet unless the material is tiny.`;
  }
  if (mode === "analyze") {
    return `Provide a thorough thematic analysis of this document: core arguments, evidence, implications, gaps, and connections.
Use ### per theme with examples from the material.`;
  }
  return `Answer the learner's question comprehensively using all section summaries as source material.`;
}

function promptForMode(
  mode: PageAskMode,
  studyGoal: StudyGoal,
  learnerName: string | null | undefined,
  articleTitle: string,
  packedMaterial: string,
  question: string | undefined,
  hasSelection: boolean,
  withTools: boolean,
  depth: StudyDepth
): { system: string; user: string; mergeInstruction: string } {
  const system = pageAskSystemPrompt(
    studyGoal,
    { name: learnerName },
    { withTools, depth }
  );

  const scopeNote = hasSelection
    ? "Highlight is the primary focus. Still use the file passages and related library notes for full-document and persona context."
    : "No highlight — answer from the full file when the question is about this document. Retrieved passages cover the whole PDF when text was indexed. If a page image is attached, that is the page the learner is viewing (use it for scanned / image-only files).";

  const material = packedMaterial.trim()
    ? packedMaterial.trim()
    : "(No extractable text — use the attached PDF page image as the document when the question is about this file.)";

  const mergeInstruction = mergeInstructionForMode(mode);

  if (mode === "deep-summary") {
    return {
      system,
      mergeInstruction,
      user: `${mergeInstruction}\n${scopeNote}\nTitle: ${articleTitle}\n\n${material}`,
    };
  }
  if (mode === "summarize") {
    const detail =
      depth === "deep"
        ? "Write a long, chapter-aware summary (~900 words). "
        : depth === "standard"
          ? "Give a complete summary with substantive bullets. "
          : "";
    return {
      system,
      mergeInstruction,
      user: `${detail}Summarize this file for revision. Use ## Summary then ### Key points and ### Recap.\n${scopeNote}\nTitle: ${articleTitle}\n\n${material}`,
    };
  }
  if (mode === "notes") {
    const length =
      depth === "quick"
        ? "Create short revision notes."
        : "Create thorough revision notes.";
    return {
      system,
      mergeInstruction,
      user: `${length} Use ## Notes, then ### Key terms and ### Must remember.\n${scopeNote}\nTitle: ${articleTitle}\n\n${material}`,
    };
  }
  if (mode === "mindmap") {
    return {
      system,
      mergeInstruction,
      user: `Create a Mermaid mind map for this material.
${scopeNote}
Title: ${articleTitle}

Output format (strict):
1. A short ## Mind map heading.
2. Then a single fenced code block tagged mermaid using the mindmap diagram type.
3. Put the central topic in root((…)). Keep 3–7 main branches, each with brief child nodes.
4. Use plain ASCII labels (no quotes, no parentheses inside node text except the root((…)) form).
5. Optional: one short ### Key takeaways bullet list after the diagram.
6. Do not use indented markdown trees instead of Mermaid.

Material:

${material}`,
    };
  }
  if (mode === "analyze") {
    return {
      system,
      mergeInstruction,
      user: `${mergeInstruction}\n${scopeNote}\nTitle: ${articleTitle}\n\n${material}`,
    };
  }

  return {
    system,
    mergeInstruction,
    user: `Question: ${question?.trim() || "Explain this clearly."}
${scopeNote}
If this question is not about the open file, answer generally (and use tools for planner/quiz/app actions when asked). Do not refuse just because the answer is not in the PDF.

File: ${articleTitle}

${material}`,
  };
}

export { promptForMode };
