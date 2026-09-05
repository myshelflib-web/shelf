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
  onFilePickerOpen,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  reveal: boolean;
  disabled?: boolean;
  onOption: (optionId: string) => void;
  onText: (text: string) => void;
  onImage: (file: File) => void;
  onFilePickerOpen?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const kind =
    question.type === "MCQ"
      ? "MCQ"
      : question.type === "IMAGE"
        ? "Upload working"
        : "Written";

  return (
    <article className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-4 border-b border-[var(--border)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded-[9px]">
            Q{index + 1}
          </span>
          <span className="font-semibold text-[var(--text-secondary)]">
            {kind}
          </span>
          <span>•</span>
          <span>{question.marks} mark{question.marks === 1 ? "" : "s"}</span>
        </div>
        <div className="flex items-center gap-2 truncate text-[var(--text-muted)]">
          {question.syllabusHeading && (
            <span className="truncate max-w-[150px] sm:max-w-[250px]">{question.syllabusHeading}</span>
          )}
          {question.syllabusHeading && question.sourceTag && <span>•</span>}
          {question.sourceTag && <span className="truncate max-w-[100px]">{question.sourceTag}</span>}
        </div>
      </div>

      <div className="text-[15px] sm:text-[17px] font-bold text-[var(--text-primary)] leading-relaxed tracking-tight mb-5">
        <QuizMarkdown content={question.prompt} />
      </div>

      {question.type === "MCQ" && question.options && (
        <div className="mt-3 grid gap-2">
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
                className={`flex items-center gap-3.5 text-left rounded-[12px] border p-3.5 transition-all duration-150 ${
                  correct
                    ? "border-emerald-500/50 bg-emerald-500/10 text-[var(--text-primary)]"
                    : wrong
                      ? "border-red-400/50 bg-red-500/10 text-[var(--text-primary)]"
                      : selected
                        ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--text-primary)] ring-1 ring-[var(--accent)]/30"
                        : "border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50 text-[var(--text-primary)]"
                } ${disabled || reveal ? "cursor-default" : "cursor-pointer"}`}
              >
                <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 text-[11px] font-extrabold transition-all duration-150 ${
                  correct
                    ? "bg-emerald-500 text-white"
                    : wrong
                      ? "bg-red-500 text-white"
                      : selected
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                }`}>
                  {opt.id}
                </div>
                <div className="text-[12.5px] font-semibold flex-1 leading-snug">
                  <QuizMarkdown content={opt.text} compact />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {question.type !== "MCQ" && (
        <div className="mt-3 space-y-3">
          <textarea
            rows={question.type === "IMAGE" ? 3 : 6}
            disabled={disabled || reveal}
            value={question.userAnswerText ?? ""}
            onChange={(e) => onText(e.target.value)}
            className={`${quizFieldClass} rounded-[12px] p-3 text-[12.5px]`}
            placeholder={
              question.type === "IMAGE"
                ? "Optional notes. Use $...$ for math."
                : "Type your answer. Use $...$ or $$...$$ for math."
            }
          />
          <div className="flex items-center gap-2.5">
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
              onClick={() => {
                onFilePickerOpen?.();
                fileRef.current?.click();
              }}
              className="h-9 px-3.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-secondary)] text-[12px] font-bold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
            >
              {question.type === "IMAGE" ? "Upload answer photo" : "Upload working"}
            </button>
            {question.userImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={question.userImageUrl}
                alt="Your uploaded answer"
                className="h-14 rounded-md border border-[var(--border)] object-cover shadow-sm"
              />
            )}
          </div>
        </div>
      )}

      {reveal && (
        <div className="mt-5 pt-4 border-t border-[var(--border)] space-y-3">
          {question.gradedScore != null && (
            <div className="inline-flex items-center gap-1.5 bg-[var(--bg-secondary)] px-3 py-1 rounded-full text-[11px] font-bold text-[var(--text-secondary)]">
              Score: {Math.round(question.gradedScore * question.marks * 10) / 10} / {question.marks}
            </div>
          )}
          {question.gradedFeedback && (
            <p className="text-[12.5px] font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)]/50 border border-[var(--border)] rounded-[12px] p-3 leading-relaxed">
              {question.gradedFeedback}
            </p>
          )}
          {question.explanation && (
            <div className="rounded-[12px] border border-[var(--border)] overflow-hidden">
              <div className="px-4 py-2 bg-[var(--bg-secondary)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                Explanation
              </div>
              <div className="px-4 py-3 bg-[var(--bg-elevated)] text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
                <QuizMarkdown content={question.explanation} />
              </div>
            </div>
          )}
          {question.modelAnswer && question.type !== "MCQ" && (
            <div className="rounded-[12px] border border-[var(--border)] overflow-hidden mt-3">
              <div className="px-4 py-2 bg-[var(--bg-secondary)] text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                Marking scheme / Model Answer
              </div>
              <div className="px-4 py-3 bg-[var(--bg-elevated)] text-[12.5px] text-[var(--text-secondary)] leading-relaxed">
                <QuizMarkdown content={question.modelAnswer} />
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
