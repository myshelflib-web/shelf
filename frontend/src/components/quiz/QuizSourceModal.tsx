"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import type { StudyGoal } from "@/types";
import type { QuizSourceKind } from "@/lib/quiz/types";
import {
  coercePyqPaper,
  coercePyqYears,
  pyqSubjectsForGoal,
  pyqYearsForGoal,
} from "@/lib/quiz/pyqOptions";
import { QuizScopeFields, type QuizScopeValue } from "./QuizScopeFields";
import { quizBtnGhost, quizBtnPrimary, quizFieldClass } from "@/lib/quiz/ui";

interface QuizSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceKind: QuizSourceKind;
  studyGoal?: StudyGoal | null;
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
  studyGoal = null,
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

  const subjectOptions = useMemo(
    () => pyqSubjectsForGoal(studyGoal),
    [studyGoal]
  );
  const yearOptions = useMemo(() => pyqYearsForGoal(studyGoal), [studyGoal]);

  useEffect(() => {
    if (isOpen) {
      setDraftScope({ ...scope, relevancyDocId: "" });
      setDraftFile(file);
      setDraftSourceText(sourceText);
      setDraftPaper(coercePyqPaper(studyGoal, pyqPaper));
      setDraftYears(coercePyqYears(studyGoal, pyqYears));
    }
  }, [isOpen, scope, file, sourceText, pyqPaper, pyqYears, studyGoal]);

  if (!isOpen) return null;

  const handleApply = () => {
    onScopeChange({ ...draftScope, relevancyDocId: "" });
    onFileChange(draftFile);
    onSourceTextChange(draftSourceText);
    onPyqPaperChange(coercePyqPaper(studyGoal, draftPaper));
    onPyqYearsChange(coercePyqYears(studyGoal, draftYears));
    onClose();
  };

  const title =
    sourceKind === "EXAM_BANK"
      ? "Practice previous questions"
      : sourceKind === "LIBRARY"
        ? "Choose library scope"
        : "Upload material";
  const subtitle =
    sourceKind === "EXAM_BANK"
      ? "Subjects follow your study goal. Narrow the paper or years only if you want to."
      : sourceKind === "LIBRARY"
        ? "Pick a folder or file. Question style follows your study goal."
        : "Upload a document or paste notes. Shelf will build questions from that material.";
  const applyLabel =
    sourceKind === "EXAM_BANK"
      ? "Use PYQs"
      : sourceKind === "UPLOAD"
        ? "Use material"
        : "Apply";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-labelledby="quiz-source-title"
        className="relative w-full max-w-[520px] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="px-5 py-4 border-b border-[var(--border)] flex justify-between items-start gap-3 shrink-0">
          <div className="min-w-0">
            <h3
              id="quiz-source-title"
              className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight"
            >
              {title}
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] mt-1 leading-relaxed">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto">
          {sourceKind === "LIBRARY" && (
            <div className="space-y-4">
              <QuizScopeFields
                value={draftScope}
                onChange={setDraftScope}
                disabled={busy}
              />
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                Narrower scope gives more precise questions from the material you
                selected.
              </p>
            </div>
          )}

          {sourceKind === "EXAM_BANK" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[11px] text-[var(--text-muted)]">
                  Subject
                  <ShelfSelect
                    value={draftPaper}
                    onChange={setDraftPaper}
                    options={subjectOptions}
                    aria-label="Subject"
                    className={`${quizFieldClass} mt-0.5 w-full`}
                  />
                </label>
                <label className="block text-[11px] text-[var(--text-muted)]">
                  Years
                  <ShelfSelect
                    value={draftYears}
                    onChange={setDraftYears}
                    options={yearOptions}
                    aria-label="Years selection"
                    className={`${quizFieldClass} mt-0.5 w-full`}
                  />
                </label>
              </div>
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                Questions keep their original wording. If an official answer key
                is unavailable or disputed, Shelf marks that question unscored
                rather than guessing.
              </p>
            </div>
          )}

          {sourceKind === "UPLOAD" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[11px] text-[var(--text-muted)]">
                Upload document
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain"
                  disabled={busy}
                  className="mt-0.5 block w-full text-[12px] text-[var(--text-secondary)] file:mr-3 file:inline-flex file:h-8 file:cursor-pointer file:items-center file:rounded-lg file:border file:border-[var(--border)] file:bg-[var(--bg-secondary)] file:px-3 file:text-[12px] file:font-medium file:text-[var(--text-primary)] hover:file:border-[var(--accent)]/40 disabled:opacity-50"
                  onChange={(e) => setDraftFile(e.target.files?.[0] ?? null)}
                />
                {draftFile ? (
                  <span className="mt-1.5 block text-[12px] text-[var(--accent)] truncate">
                    {draftFile.name}
                  </span>
                ) : (
                  <span className="mt-1.5 block text-[12px] text-[var(--text-muted)]">
                    PDF, TXT, or Markdown
                  </span>
                )}
              </label>
              <label className="block text-[11px] text-[var(--text-muted)]">
                Or paste notes
                <textarea
                  rows={5}
                  disabled={busy}
                  value={draftSourceText}
                  onChange={(e) => setDraftSourceText(e.target.value)}
                  className={`${quizFieldClass} mt-0.5 py-2 min-h-[7.5rem] text-[13px]`}
                  placeholder="Paste notes, chapter excerpts, or outlines…"
                />
              </label>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-[var(--text-muted)] max-w-[220px] leading-snug">
            {sourceKind === "EXAM_BANK"
              ? "You can still choose Practice or Timed on the Quiz screen."
              : ""}
          </p>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onClose} className={quizBtnGhost}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={quizBtnPrimary}
            >
              {applyLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
