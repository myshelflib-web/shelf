"use client";

import { StudyAIContent } from "@/lib/studyAiMarkdown";

export function QuizMarkdown({
  content,
  compact = false,
}: {
  content: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "quiz-md inline [&_.study-ai-prose]:inline [&_.study-ai-prose_p]:my-0 [&_.study-ai-prose_p]:inline"
          : "quiz-md text-[14px] leading-relaxed text-[var(--text-primary)]"
      }
    >
      <StudyAIContent content={content} />
    </div>
  );
}
