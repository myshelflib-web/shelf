"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ChatContextKind, StudyRelevancyDocSummary, UserSubject } from "@/types";
import { quizApi } from "@/lib/quiz/api";
import type { QuizLaunch, QuizSourceKind } from "@/lib/quiz/types";
import { DIFFICULTY_LABELS, quizHref } from "@/lib/quiz/href";
import { quizBtnPrimary, quizFieldClass } from "@/lib/quiz/ui";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { type QuizScopeValue } from "./QuizScopeFields";
import { QuizCustomizeModal, type CustomizeSettings } from "./QuizCustomizeModal";
import { QuizSourceModal } from "./QuizSourceModal";

function sourceFromLaunch(launch?: QuizLaunch): QuizSourceKind {
  const v = String(launch?.source ?? "LIBRARY").toUpperCase();
  if (v === "UPLOAD" || v === "EXAM_BANK") return v;
  return "LIBRARY";
}

function scopeFromLaunch(launch?: QuizLaunch): QuizScopeValue {
  const kind = String(launch?.contextKind ?? "LIBRARY").toUpperCase();
  const contextKind: ChatContextKind =
    kind === "NOTEBOOK" || kind === "TOPIC" || kind === "PAGE" ? kind : "LIBRARY";
  return {
    contextKind,
    contextNotebookId: launch?.notebookId ?? "",
    contextTopicId: launch?.topicId ?? "",
    contextPageId: launch?.pageId ?? "",
    relevancyDocId: launch?.relevancyDocId ?? "",
  };
}

const SOURCES: Array<{ id: QuizSourceKind; title: string; body: string }> = [
  {
    id: "LIBRARY",
    title: "My Library",
    body: "Use a file, topic, collection, or a wider part of your Shelf.",
  },
  {
    id: "UPLOAD",
    title: "Upload",
    body: "Use material that is not in your Shelf yet.",
  },
  {
    id: "EXAM_BANK",
    title: "Exam bank",
    body: "Practice original previous-year questions and standard papers.",
  },
];

export function QuizSetup({ launch }: { launch?: QuizLaunch }) {
  const router = useRouter();
  const initial = useMemo(() => scopeFromLaunch(launch), [launch]);
  const [sourceKind, setSourceKind] = useState<QuizSourceKind>(() =>
    sourceFromLaunch(launch)
  );
  const [scope, setScope] = useState<QuizScopeValue>(initial);
  const [difficulty, setDifficulty] = useState("EXAM");
  const [timeLimitSec, setTimeLimitSec] = useState<number | null>(1800);
  const [mcqCount, setMcqCount] = useState(8);
  const [writtenCount, setWrittenCount] = useState(2);
  const [proctored, setProctored] = useState(false); // Default to Practice (proctored=false) per HTML mockup defaults
  const [focus, setFocus] = useState(launch?.focus ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Popup Modal states
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);

  // Notebooks & docs list for display name resolution
  const [notebooks, setNotebooks] = useState<UserSubject[]>([]);
  const [docs, setDocs] = useState<StudyRelevancyDocSummary[]>([]);

  useEffect(() => {
    void api.myContent
      .listSubjects({ pageSize: 100, sort: "name" })
      .then(({ subjects }) => setNotebooks(subjects))
      .catch(() => {});
    void api.study
      .listRelevancyDocs()
      .then(({ docs: next }) => setDocs(next))
      .catch(() => {});
  }, []);

  const [customizeSettings, setCustomizeSettings] = useState<CustomizeSettings>({
    questions: "10",
    difficulty: "EXAM",
    mix: "balanced",
    timer: "auto",
  });

  const handleApplySettings = (nextSettings: CustomizeSettings) => {
    setCustomizeSettings(nextSettings);
    setDifficulty(nextSettings.difficulty);

    // Apply Timer
    if (nextSettings.timer === "auto") {
      setTimeLimitSec(1800); // 30 minutes
    } else {
      setTimeLimitSec(Number(nextSettings.timer) * 60);
    }

    // Apply Question count and mix mapping
    const N = Number(nextSettings.questions);
    const mix = nextSettings.mix;

    let mcq = 8;
    let writ = 2;

    if (N === 5) {
      if (mix === "mcq") {
        mcq = 5;
        writ = 0;
      } else if (mix === "written") {
        mcq = 2;
        writ = 3;
      } else {
        mcq = 4;
        writ = 1;
      }
    } else if (N === 10) {
      if (mix === "mcq") {
        mcq = 10;
        writ = 0;
      } else if (mix === "mostly-mcq") {
        mcq = 9;
        writ = 1;
      } else if (mix === "written") {
        mcq = 5;
        writ = 5;
      } else {
        mcq = 8;
        writ = 2;
      }
    } else if (N === 15) {
      if (mix === "mcq") {
        mcq = 15;
        writ = 0;
      } else if (mix === "mostly-mcq") {
        mcq = 13;
        writ = 2;
      } else if (mix === "written") {
        mcq = 7;
        writ = 8;
      } else {
        mcq = 12;
        writ = 3;
      }
    } else if (N === 20) {
      if (mix === "mcq") {
        mcq = 20;
        writ = 0;
      } else if (mix === "mostly-mcq") {
        mcq = 18;
        writ = 2;
      } else if (mix === "written") {
        mcq = 10;
        writ = 10;
      } else {
        mcq = 16;
        writ = 4;
      }
    }

    setMcqCount(mcq);
    setWrittenCount(writ);
  };

  const start = async () => {
    if (busy) return;
    if (sourceKind === "UPLOAD" && !file && !sourceText.trim()) {
      setError("Please configure upload material first by clicking Change.");
      setSourceModalOpen(true);
      return;
    }
    if (sourceKind === "LIBRARY") {
      if (scope.contextKind === "NOTEBOOK" && !scope.contextNotebookId) {
        setError("Please select a folder first by clicking Change.");
        setSourceModalOpen(true);
        return;
      }
      if (scope.contextKind === "TOPIC" && !scope.contextTopicId) {
        setError("Please select a nested folder first by clicking Change.");
        setSourceModalOpen(true);
        return;
      }
      if (scope.contextKind === "PAGE" && !scope.contextPageId) {
        setError("Please select a document first by clicking Change.");
        setSourceModalOpen(true);
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      const { quiz } = await quizApi.create({
        sourceKind,
        difficulty,
        mcqCount,
        writtenCount,
        timeLimitSec,
        proctored,
        contextKind: sourceKind === "LIBRARY" ? scope.contextKind : "LIBRARY",
        contextNotebookId: scope.contextNotebookId || null,
        contextTopicId: scope.contextTopicId || null,
        contextPageId: scope.contextPageId || null,
        relevancyDocId: scope.relevancyDocId || null,
        focusTopic: focus.trim() || null,
        sourceText: sourceKind === "UPLOAD" ? sourceText || null : null,
        file: sourceKind === "UPLOAD" ? file : null,
      });
      track(AnalyticsEvents.quizGenerated, {
        sourceKind,
        difficulty,
        mcqCount,
        writtenCount,
        proctored,
      });
      router.push(quizHref(quiz.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start quiz";
      setError(message);
      track(AnalyticsEvents.quizGenerationFailed, {
        sourceKind,
        phase: "create",
        error: message,
      });
    } finally {
      setBusy(false);
    }
  };

  // Helper labels for settings
  const labelDifficulty = (val: string) => {
    if (val === "EXAM") return "Mixed";
    return DIFFICULTY_LABELS[val] ?? "Mixed";
  };

  const labelMix = (val: string) => {
    if (val === "balanced") return "Balanced mix";
    if (val === "mcq") return "MCQs only";
    if (val === "mostly-mcq") return "Mostly MCQs";
    return "More written";
  };

  const mixLabel = useMemo(() => {
    if (mcqCount === 0) return "Written only";
    if (writtenCount === 0) return "MCQs only";
    const ratio = mcqCount / (mcqCount + writtenCount);
    if (ratio >= 0.8) return "Mostly MCQs";
    return "Balanced mix";
  }, [mcqCount, writtenCount]);

  // Compute dynamic header display for current selected source popup context
  const sourceDisplayTitle = useMemo(() => {
    if (sourceKind === "EXAM_BANK") {
      return "Exam Bank material";
    }
    if (sourceKind === "UPLOAD") {
      if (file) return `Uploaded: ${file.name}`;
      if (sourceText.trim()) {
        const textSlice = sourceText.trim().slice(0, 32);
        return `Pasted: "${textSlice}${sourceText.trim().length > 32 ? "..." : ""}"`;
      }
      return "Configure your upload materials";
    }

    // LIBRARY Kind
    if (scope.contextKind === "LIBRARY") {
      return "Entire Library";
    }

    const nb = notebooks.find((n) => n.id === scope.contextNotebookId);
    const folderName = nb?.name || "Select folder...";

    if (scope.contextKind === "NOTEBOOK") {
      return `Folder › ${folderName}`;
    }

    if (scope.contextKind === "TOPIC") {
      const topicName =
        nb?.topicGroups?.find((t) => t.id === scope.contextTopicId)?.title ||
        "Select nested folder...";
      return `${folderName} › ${topicName}`;
    }

    // PAGE Kind
    const pageTitle =
      nb?.pages?.find((p) => p.id === scope.contextPageId)?.title ||
      nb?.topicGroups
        ?.flatMap((t) => t.pages ?? [])
        .find((p) => p.id === scope.contextPageId)?.title ||
      "Select file...";

    return `${folderName} › ${pageTitle}`;
  }, [sourceKind, scope, file, sourceText, notebooks]);

  const sourceDisplaySubtitle = useMemo(() => {
    let base = "";
    if (sourceKind === "EXAM_BANK") {
      base = "Exam bank · preloaded curriculum & syllabus";
    } else if (sourceKind === "UPLOAD") {
      if (file) {
        base = `Document · ${(file.size / 1024).toFixed(1)} KB`;
      } else if (sourceText.trim()) {
        base = `Pasted text · ${sourceText.trim().length} chars`;
      } else {
        base = "No document or notes uploaded yet. Click Change to configure.";
      }
    } else {
      // LIBRARY
      const kindLabel =
        scope.contextKind === "LIBRARY"
          ? "whole shelf"
          : scope.contextKind === "NOTEBOOK"
          ? "folder"
          : scope.contextKind === "TOPIC"
          ? "nested folder"
          : "file";
      base = `My Library · ${kindLabel}`;
    }

    if (scope.relevancyDocId) {
      const docTitle = docs.find((d) => d.id === scope.relevancyDocId)?.title;
      if (docTitle) {
        base += ` · Syllabus: ${docTitle}`;
      }
    }
    return base;
  }, [sourceKind, scope.contextKind, scope.relevancyDocId, file, sourceText, docs]);

  return (
    <>
      <div className="h-full min-h-0 flex flex-col overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm">
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Block 1: What should the quiz use? */}
          <div className="space-y-3">
            <div>
              <h2 className="text-[14px] font-bold text-[var(--text-primary)]">
                What should the quiz use?
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Pick one source.
              </p>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-3">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSourceKind(s.id);
                    // Reset or setup default scope if switching
                    if (s.id !== "LIBRARY") {
                      setScope((prev) => ({ ...prev, contextKind: "LIBRARY" }));
                    }
                  }}
                  className={`flex flex-col text-left rounded-[14px] border px-4 py-3 bg-[var(--bg-elevated)] transition-all duration-150 min-h-[96px] ${
                    sourceKind === s.id
                      ? "border-[var(--accent)] bg-[var(--accent-subtle)] ring-1 ring-[var(--accent)]/30"
                      : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  <div className="text-[12px] font-bold text-[var(--text-primary)]">
                    {s.title}
                  </div>
                  <p className="mt-1.5 text-[10.5px] text-[var(--text-muted)] leading-snug">
                    {s.body}
                  </p>
                </button>
              ))}
            </div>

            {/* Premium selection Display (selectedSource / Change popup trigger) */}
            <div className="selected mt-4 border border-[var(--border)] bg-[var(--bg-secondary)]/30 dark:bg-[var(--bg-secondary)]/15 rounded-[12px] p-4 flex items-center justify-between shadow-sm">
              <div className="selMain flex-1 min-w-0 pr-4">
                <div className="selName font-bold text-[12.5px] text-[var(--text-primary)] truncate">
                  {sourceDisplayTitle}
                </div>
                <div className="selMeta text-[10.5px] text-[var(--text-muted)] mt-1 font-semibold leading-normal">
                  {sourceDisplaySubtitle}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSourceModalOpen(true)}
                className="change h-[29px] border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-secondary)] rounded-[8px] px-3.5 text-[11.5px] text-[var(--accent)] font-extrabold transition-all shrink-0 shadow-xs"
              >
                Change
              </button>
            </div>
          </div>

          {/* Block 2: How do you want to take it? */}
          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-[14px] font-bold text-[var(--text-primary)]">
                How do you want to take it?
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Practice is casual self-testing; Timed assessment sets an exact duration.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setProctored(false)}
                className={`text-left rounded-[14px] border px-4 py-3 bg-[var(--bg-elevated)] transition-all duration-150 ${
                  !proctored
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)] ring-1 ring-[var(--accent)]/30"
                    : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <div className="text-[12.5px] font-bold text-[var(--text-primary)]">
                  Practice
                </div>
                <p className="mt-1.5 text-[10.5px] text-[var(--text-muted)] leading-relaxed">
                  Flexible self-testing with feedback as you go.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setProctored(true)}
                className={`text-left rounded-[14px] border px-4 py-3 bg-[var(--bg-elevated)] transition-all duration-150 ${
                  proctored
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)] ring-1 ring-[var(--accent)]/30"
                    : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <div className="text-[12.5px] font-bold text-[var(--text-primary)]">
                  Timed assessment
                </div>
                <p className="mt-1.5 text-[10.5px] text-[var(--text-muted)] leading-relaxed">
                  Focused attempt with feedback at the end.
                </p>
              </button>
            </div>
          </div>

          {/* Block 3: Focus on anything specific? */}
          <div className="space-y-2 pt-2">
            <h2 className="text-[14px] font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              Focus on anything specific?
              <span className="text-[10px] font-medium text-[var(--text-muted)] lowercase bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">
                Optional
              </span>
            </h2>
            <input
              type="text"
              disabled={busy}
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g. Transformers, corporate finance, heat transfer..."
              className="w-full h-11 border border-[var(--border)] bg-[var(--bg-elevated)] rounded-[12px] px-3.5 outline-none text-[11.5px] focus:border-[var(--accent)] transition-colors duration-150 shadow-sm"
            />
          </div>

          {/* Summary Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            <span className="h-[26px] px-3 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-subtle)] text-[10.5px] text-[var(--accent)] font-semibold inline-flex items-center justify-center">
              {mcqCount + writtenCount} questions
            </span>
            <span className="h-[26px] px-3 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[10.5px] text-[var(--text-secondary)] font-medium inline-flex items-center justify-center">
              {labelDifficulty(difficulty)} difficulty
            </span>
            <span className="h-[26px] px-3 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[10.5px] text-[var(--text-secondary)] font-medium inline-flex items-center justify-center">
              {mixLabel}
            </span>
            <span className="h-[26px] px-3 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[10.5px] text-[var(--text-secondary)] font-medium inline-flex items-center justify-center">
              {proctored ? "Timed assessment" : "Practice"}
            </span>
            {proctored && (
              <span className="h-[26px] px-3 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[10.5px] text-[var(--text-secondary)] font-medium inline-flex items-center justify-center">
                {timeLimitSec ? `${timeLimitSec / 60} min timer` : "No timer"}
              </span>
            )}
            <span className="h-[26px] px-3 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[10.5px] text-[var(--text-secondary)] font-medium inline-flex items-center justify-center">
              Based on selected material
            </span>
          </div>

          {/* Customize Button */}
          <button
            type="button"
            onClick={() => setCustomizeOpen(true)}
            className="w-full min-h-[48px] border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-secondary)] rounded-[12px] p-2.5 flex items-center gap-3 text-left transition-all duration-150 group shadow-sm"
          >
            <span className="w-[30px] h-[30px] rounded-[9px] bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] stroke-current fill-none stroke-[2]" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h10" />
                <path d="M18 7h2" />
                <circle cx="16" cy="7" r="2" />
                <path d="M4 17h2" />
                <path d="M10 17h10" />
                <circle cx="8" cy="17" r="2" />
                <path d="M4 12h4" />
                <path d="M12 12h8" />
                <circle cx="10" cy="12" r="2" />
              </svg>
            </span>
            <span className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-[var(--text-primary)] block">
                Customize quiz
              </span>
              <span className="text-[9.5px] text-[var(--text-muted)] mt-0.5 leading-snug block">
                {customizeSettings.questions === "10" &&
                customizeSettings.difficulty === "EXAM" &&
                customizeSettings.mix === "balanced" &&
                customizeSettings.timer === "auto"
                  ? "Adjust question count, difficulty, question mix, or timer"
                  : `${customizeSettings.questions} questions · ${labelDifficulty(
                      customizeSettings.difficulty
                    )} · ${labelMix(customizeSettings.mix)}${
                      proctored
                        ? ` · ${
                            customizeSettings.timer === "auto"
                              ? "Auto timer"
                              : `${customizeSettings.timer} min`
                          }`
                        : ""
                    }`}
              </span>
            </span>
            <span className="w-[18px] h-[18px] text-[var(--text-muted)] flex items-center justify-center shrink-0 ml-auto group-hover:translate-x-0.5 transition-transform">
              <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] stroke-current fill-none stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </span>
          </button>

          {error && (
            <p className="text-[11.5px] font-medium text-red-400 mt-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]/30">
          <div className="text-[10px] text-[var(--text-muted)] max-w-[280px] sm:max-w-[400px] leading-relaxed">
            Shelf will choose a balanced question set from the selected source.
          </div>
          <button
            type="button"
            className={`${quizBtnPrimary} h-[39px] rounded-[10px] px-4 text-[12px] font-bold`}
            disabled={busy}
            onClick={() => void start()}
          >
            {busy ? "Starting…" : "Generate quiz"}
          </button>
        </div>
      </div>

      {/* Customize overlay modal */}
      <QuizCustomizeModal
        isOpen={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        onApply={handleApplySettings}
        initialSettings={customizeSettings}
        proctored={proctored}
      />

      {/* Source overlay modal */}
      <QuizSourceModal
        isOpen={sourceModalOpen}
        onClose={() => setSourceModalOpen(false)}
        sourceKind={sourceKind}
        scope={scope}
        onScopeChange={setScope}
        file={file}
        onFileChange={setFile}
        sourceText={sourceText}
        onSourceTextChange={setSourceText}
        busy={busy}
      />
    </>
  );
}
