"use client";

import { useEffect, useState, useMemo } from "react";
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import type { QuizSourceKind } from "@/lib/quiz/types";
import { QuizScopeFields, type QuizScopeValue } from "./QuizScopeFields";
import { quizFieldClass } from "@/lib/quiz/ui";

interface QuizSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceKind: QuizSourceKind;
  scope: QuizScopeValue;
  onScopeChange: (next: QuizScopeValue) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  pyqPaper: string;
  onPyqPaperChange: (paper: string) => void;
  pyqYears: string;
  onPyqYearsChange: (years: string) => void;
  busy: boolean;
}

export function QuizSourceModal({
  isOpen,
  onClose,
  sourceKind,
  scope,
  onScopeChange,
  file,
  onFileChange,
  sourceText,
  onSourceTextChange,
  pyqPaper,
  onPyqPaperChange,
  pyqYears,
  onPyqYearsChange,
  busy,
}: QuizSourceModalProps) {
  const [draftScope, setDraftScope] = useState<QuizScopeValue>(scope);
  const [draftFile, setDraftFile] = useState<File | null>(file);
  const [draftSourceText, setDraftSourceText] = useState<string>(sourceText);
  const [draftPaper, setDraftPaper] = useState<string>(pyqPaper);
  const [draftYears, setDraftYears] = useState<string>(pyqYears);

  useEffect(() => {
    if (isOpen) {
      setDraftScope(scope);
      setDraftFile(file);
      setDraftSourceText(sourceText);
      setDraftPaper(pyqPaper);
      setDraftYears(pyqYears);
    }
  }, [isOpen, scope, file, sourceText, pyqPaper, pyqYears]);

  if (!isOpen) return null;

  const handleApply = () => {
    onScopeChange(draftScope);
    onFileChange(draftFile);
    onSourceTextChange(draftSourceText);
    onPyqPaperChange(draftPaper);
    onPyqYearsChange(draftYears);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[520px] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[15px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
              {sourceKind === "EXAM_BANK" ? "Practice previous questions" : sourceKind === "LIBRARY" ? "Configure Library Scope" : "Configure Upload Material"}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-normal">
              {sourceKind === "EXAM_BANK"
                ? "Shelf already knows the exam context. Only narrow it if you want to."
                : "Specify which parts of your library or materials Shelf should use to construct the questions."}
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
          {sourceKind === "LIBRARY" && (
            <div className="space-y-4">
              <QuizScopeFields
                value={draftScope}
                onChange={setDraftScope}
                disabled={busy}
              />
            </div>
          )}

          {sourceKind === "EXAM_BANK" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Paper / subject dropdown */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Paper / subject
                  </span>
                  <ShelfSelect
                    value={draftPaper}
                    onChange={setDraftPaper}
                    options={[
                      { value: "Mechanical Engineering", label: "Mechanical Engineering" },
                      { value: "General Aptitude", label: "General Aptitude" },
                      { value: "All papers", label: "All papers" },
                    ]}
                    aria-label="Paper / subject"
                    className="w-full h-9"
                  />
                </div>

                {/* Years dropdown */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Years
                  </span>
                  <ShelfSelect
                    value={draftYears}
                    onChange={setDraftYears}
                    options={[
                      { value: "Last 5 available years", label: "Last 5 available years" },
                      { value: "2020–2025", label: "2020–2025" },
                      { value: "All available years", label: "All available years" },
                    ]}
                    aria-label="Years selection"
                    className="w-full h-9"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] leading-relaxed">
                Questions use their original wording. If an official answer key is unavailable or disputed, Shelf should mark that question unscored rather than guess.
              </div>
            </div>
          )}

          {sourceKind === "UPLOAD" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide flex flex-col gap-1.5">
                  Upload Document
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain"
                    disabled={busy}
                    className={`${quizFieldClass} h-9 rounded-[9px]`}
                    onChange={(e) => setDraftFile(e.target.files?.[0] ?? null)}
                  />
                  {draftFile && (
                    <span className="text-[10px] text-[var(--accent)] font-semibold truncate mt-1">
                      Selected: {draftFile.name}
                    </span>
                  )}
                </label>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide flex flex-col gap-1.5">
                  Or paste notes
                  <textarea
                    rows={4}
                    disabled={busy}
                    value={draftSourceText}
                    onChange={(e) => setDraftSourceText(e.target.value)}
                    className={`${quizFieldClass} py-1.5 rounded-[9px] text-[12px]`}
                    placeholder="Paste corporate finance notes, OS scheduling chapters, etc…"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-[var(--border)]">
                <QuizScopeFields
                  value={{ ...draftScope, contextKind: "LIBRARY" }}
                  onChange={(next) => setDraftScope({ ...next, contextKind: "LIBRARY" })}
                  disabled={busy}
                  syllabusOnly
                />
              </div>
            </div>
          )}

          {sourceKind !== "EXAM_BANK" && (
            <div className="p-3 rounded-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] leading-relaxed">
              By configuring the exact files or folders, Shelf will contextually target its question generation to give you highly precise study sessions.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-secondary)]/50">
          <div className="text-[10px] text-[var(--text-muted)] max-w-[200px] leading-tight">
            {sourceKind === "EXAM_BANK"
              ? "You can still choose Practice or Timed assessment on the main Quiz screen."
              : ""}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-[34px] px-4 border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-secondary)] rounded-[9px] text-[11.5px] font-semibold text-[var(--text-secondary)] transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="h-[34px] px-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-[9px] text-[11.5px] font-bold text-white transition-all shadow-sm"
            >
              {sourceKind === "EXAM_BANK" ? "Use PYQs" : "Apply changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
