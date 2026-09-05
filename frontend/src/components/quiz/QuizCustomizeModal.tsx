"use client";

import { useEffect, useState } from "react";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

export type CustomizeSettings = {
  questions: string;
  difficulty: string;
  mix: string;
  timer: string;
};

interface QuizCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (settings: CustomizeSettings) => void;
  initialSettings: CustomizeSettings;
  proctored: boolean;
}

export function QuizCustomizeModal({
  isOpen,
  onClose,
  onApply,
  initialSettings,
  proctored,
}: QuizCustomizeModalProps) {
  const [draft, setDraft] = useState<CustomizeSettings>(initialSettings);

  // Sync draft whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setDraft(initialSettings);
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleReset = () => {
    setDraft({
      questions: "10",
      difficulty: "EXAM",
      mix: "balanced",
      timer: "auto",
    });
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const isPractice = !proctored;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[500px] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[15px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
              Customize quiz
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-normal">
              Change only what you care about. Shelf keeps sensible defaults for everything else.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[18px] text-[var(--text-muted)] hover:text-[var(--text-primary)] leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {/* Questions dropdown */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Questions
              </span>
              <ShelfSelect
                value={draft.questions}
                onChange={(questions) =>
                  setDraft((prev) => ({ ...prev, questions }))
                }
                options={[
                  { value: "5", label: "5 questions" },
                  { value: "10", label: "10 questions" },
                  { value: "15", label: "15 questions" },
                  { value: "20", label: "20 questions" },
                ]}
                aria-label="Question count"
                className="w-full h-9"
              />
            </div>

            {/* Difficulty dropdown */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Difficulty
              </span>
              <ShelfSelect
                value={draft.difficulty}
                onChange={(difficulty) =>
                  setDraft((prev) => ({ ...prev, difficulty }))
                }
                options={[
                  { value: "EXAM", label: "Mixed" },
                  { value: "EASY", label: "Easy" },
                  { value: "MEDIUM", label: "Moderate" },
                  { value: "HARD", label: "Hard" },
                ]}
                aria-label="Quiz difficulty"
                className="w-full h-9"
              />
            </div>

            {/* Question mix dropdown */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Question mix
              </span>
              <ShelfSelect
                value={draft.mix}
                onChange={(mix) => setDraft((prev) => ({ ...prev, mix }))}
                options={[
                  { value: "balanced", label: "Balanced" },
                  { value: "mcq", label: "MCQs only" },
                  { value: "mostly-mcq", label: "Mostly MCQs" },
                  { value: "written", label: "More written answers" },
                ]}
                aria-label="Question mix"
                className="w-full h-9"
              />
            </div>

            {/* Timer dropdown */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Timer
              </span>
              <ShelfSelect
                value={draft.timer}
                disabled={isPractice}
                onChange={(timer) => setDraft((prev) => ({ ...prev, timer }))}
                options={[
                  { value: "auto", label: "Automatic" },
                  { value: "15", label: "15 minutes" },
                  { value: "30", label: "30 minutes" },
                  { value: "45", label: "45 minutes" },
                  { value: "60", label: "60 minutes" },
                ]}
                aria-label="Timer setting"
                className="w-full h-9"
              />
              {isPractice && (
                <div className="text-[9px] text-[var(--text-muted)] leading-tight mt-0.5">
                  Timer is not used in Practice mode.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] leading-relaxed">
            These controls are optional. If you leave them untouched, Shelf generates a balanced 10-question quiz using the selected material.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-secondary)]/50">
          <div className="text-[10px] text-[var(--text-muted)] max-w-[200px] leading-tight">
            {isPractice
              ? "Practice mode does not use a timer."
              : "Timed assessment will use the timer selected above."}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="h-[34px] px-3.5 border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] hover:text-[var(--accent)] rounded-[9px] text-[11.5px] font-semibold text-[var(--text-secondary)] transition-all"
            >
              Reset defaults
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="h-[34px] px-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-[9px] text-[11.5px] font-bold text-white transition-all"
            >
              Apply changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
