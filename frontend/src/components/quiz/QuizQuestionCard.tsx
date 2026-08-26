"use client";

import { useRef } from "react";
import type { QuizQuestion } from "@/lib/quiz/types";
import { quizFieldClass } from "@/lib/quiz/ui";
import { QuizMarkdown } from "./QuizMarkdown";

export function QuizQuestionCard({
  question,
  index,
  total,
  reveal,
  disabled,
  onOption,
  onText,
  onImage,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  reveal: boolean;
  disabled?: boolean;
  onOption: (optionId: string) => void;
  onText: (text: string) => void;
  onImage: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const kind =
    question.type === "MCQ"
      ? "MCQ"
      : question.type === "IMAGE"
        ? "Upload working"
        : "Written";

  return (
    <article className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mb-2">
        <span className="font-semibold text-[var(--text-secondary)]">
          Q{index + 1} / {total}
        </span>
        <span>{kind}</span>
        <span>{question.marks} mark{question.marks === 1 ? "" : "s"}</span>
        {question.syllabusHeading && (
          <span className="truncate">{question.syllabusHeading}</span>
        )}
        {question.sourceTag && <span>{question.sourceTag}</span>}
      </div>
      <QuizMarkdown content={question.prompt} />

      {question.type === "MCQ" && question.options && (
        <div className="mt-3 grid gap-1.5">
          {question.options.map((opt) => {
            const selected = question.userAnswerOption === opt.id;
            const correct = reveal && question.correctOptionId === opt.id;
            const wrong = reveal && selected && !correct;
            return (
              <div
                key={opt.id}
                role="button"
                tabIndex={disabled || reveal ? -1 : 0}
                onClick={() => {
                  if (!disabled && !reveal) onOption(opt.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!disabled && !reveal) onOption(opt.id);
                  }
                }}
                className={`text-left rounded-[10px] border px-3 py-2 text-[13px] transition-colors ${
                  correct
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : wrong
                      ? "border-red-400/50 bg-red-500/10"
                      : selected
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                        : "border-[var(--border)] hover:border-[var(--accent)]"
                } ${disabled || reveal ? "cursor-default" : "cursor-pointer"}`}
              >
                <span className="font-semibold mr-2">{opt.id}.</span>
                <QuizMarkdown content={opt.text} compact />
              </div>
            );
          })}
        </div>
      )}

      {question.type !== "MCQ" && (
        <div className="mt-3 space-y-2">
          <textarea
            rows={question.type === "IMAGE" ? 3 : 6}
            disabled={disabled || reveal}
            value={question.userAnswerText ?? ""}
            onChange={(e) => onText(e.target.value)}
            className={quizFieldClass}
            placeholder={
              question.type === "IMAGE"
                ? "Optional notes. Use $...$ for math."
                : "Type your answer. Use $...$ or $$...$$ for math."
            }
          />
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImage(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={disabled || reveal}
              onClick={() => fileRef.current?.click()}
              className="h-8 px-2.5 rounded-lg border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              {question.type === "IMAGE" ? "Upload answer photo" : "Upload working"}
            </button>
            {question.userImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={question.userImageUrl}
                alt="Your uploaded answer"
                className="h-14 rounded-md border border-[var(--border)] object-cover"
              />
            )}
          </div>
        </div>
      )}

      {reveal && (
        <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2">
          {question.gradedScore != null && (
            <p className="text-[12px] text-[var(--text-secondary)]">
              Score: {Math.round(question.gradedScore * question.marks * 10) / 10} /{" "}
              {question.marks}
            </p>
          )}
          {question.gradedFeedback && (
            <p className="text-[13px] text-[var(--text-secondary)]">
              {question.gradedFeedback}
            </p>
          )}
          {question.explanation && (
            <div>
              <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                Explanation
              </div>
              <QuizMarkdown content={question.explanation} />
            </div>
          )}
          {question.modelAnswer && question.type !== "MCQ" && (
            <div>
              <div className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                Marking scheme
              </div>
              <QuizMarkdown content={question.modelAnswer} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
