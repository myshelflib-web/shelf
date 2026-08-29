"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChatContextKind } from "@/types";
import { quizApi } from "@/lib/quiz/api";
import type { QuizLaunch, QuizSourceKind } from "@/lib/quiz/types";
import { DIFFICULTY_LABELS, TIME_OPTIONS, quizHref } from "@/lib/quiz/href";
import { quizBtnPrimary, quizFieldClass } from "@/lib/quiz/ui";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import {
  QuizScopeFields,
  type QuizScopeValue,
} from "./QuizScopeFields";

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
    title: "Library",
    body: "A document, topic, or whole collection.",
  },
  {
    id: "UPLOAD",
    title: "Upload",
    body: "Your notes plus an optional syllabus.",
  },
  {
    id: "EXAM_BANK",
    title: "Exam bank",
    body: "PYQs, standard papers, and preloaded material.",
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
  const [proctored, setProctored] = useState(true);
  const [focus, setFocus] = useState(launch?.focus ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    if (busy) return;
    if (sourceKind === "UPLOAD" && !file && !sourceText.trim()) {
      setError("Upload a document or paste notes to quiz on.");
      return;
    }
    if (sourceKind === "LIBRARY") {
      if (scope.contextKind === "NOTEBOOK" && !scope.contextNotebookId) {
        setError("Choose a collection.");
        return;
      }
      if (scope.contextKind === "TOPIC" && !scope.contextTopicId) {
        setError("Choose a topic.");
        return;
      }
      if (scope.contextKind === "PAGE" && !scope.contextPageId) {
        setError("Choose a document.");
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

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
      <div className="grid gap-2 sm:grid-cols-3 mb-4">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSourceKind(s.id)}
            className={`text-left rounded-[10px] border px-3 py-2.5 transition-colors ${
              sourceKind === s.id
                ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                : "border-[var(--border)] hover:border-[var(--accent)]"
            }`}
          >
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">
              {s.title}
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)] leading-snug">
              {s.body}
            </p>
          </button>
        ))}
      </div>

      {sourceKind === "LIBRARY" && (
        <QuizScopeFields value={scope} onChange={setScope} disabled={busy} />
      )}
      {sourceKind === "EXAM_BANK" && (
        <div className="space-y-3">
          <p className="text-[12px] text-[var(--text-muted)]">
            Uses your study goal, syllabus if attached, PYQ/standard papers in
            your library, and preloaded curriculum when available.
          </p>
          <QuizScopeFields
            value={{ ...scope, contextKind: "LIBRARY" }}
            onChange={(next) => setScope({ ...next, contextKind: "LIBRARY" })}
            disabled={busy}
            syllabusOnly
          />
        </div>
      )}
      {sourceKind === "UPLOAD" && (
        <div className="grid gap-3">
          <label className="text-[12px] font-medium text-[var(--text-secondary)]">
            Document
            <input
              type="file"
              accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain"
              disabled={busy}
              className={quizFieldClass}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="text-[12px] font-medium text-[var(--text-secondary)]">
            Or paste notes
            <textarea
              rows={4}
              disabled={busy}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className={quizFieldClass}
              placeholder="Paste the chapter, notes, or question bank text…"
            />
          </label>
          <QuizScopeFields
            value={{ ...scope, contextKind: "LIBRARY" }}
            onChange={(next) => setScope({ ...next, contextKind: "LIBRARY" })}
            disabled={busy}
            syllabusOnly
          />
        </div>
      )}

      <div className="text-[12px] font-medium text-[var(--text-secondary)] mb-2">
        Sitting
      </div>
      <div className="grid gap-2 sm:grid-cols-2 mb-4">
        {(
          [
            {
              id: true,
              title: "Proctored",
              body: "Opens fullscreen. Switching tabs or leaving the window ends the quiz.",
            },
            {
              id: false,
              title: "Practice",
              body: "Stay in the app. Tab switches are allowed; the timer still runs.",
            },
          ] as const
        ).map((s) => (
          <button
            key={String(s.id)}
            type="button"
            onClick={() => setProctored(s.id)}
            className={`text-left rounded-[10px] border px-3 py-2.5 transition-colors ${
              proctored === s.id
                ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                : "border-[var(--border)] hover:border-[var(--accent)]"
            }`}
          >
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">
              {s.title}
            </div>
            <p className="mt-0.5 text-[11px] text-[var(--text-muted)] leading-snug">
              {s.body}
            </p>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mt-4">
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">
          Difficulty
          <ShelfSelect
            className={quizFieldClass}
            disabled={busy}
            value={difficulty}
            options={Object.entries(DIFFICULTY_LABELS).map(([id, label]) => ({
              value: id,
              label,
            }))}
            aria-label="Difficulty"
            onChange={setDifficulty}
          />
        </label>
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">
          Time
          <ShelfSelect
            className={quizFieldClass}
            disabled={busy}
            value={String(timeLimitSec ?? 0)}
            options={TIME_OPTIONS.map((t) => ({
              value: String(t.sec ?? 0),
              label: t.label,
            }))}
            aria-label="Time limit"
            onChange={(v) => {
              const n = Number(v);
              setTimeLimitSec(n > 0 ? n : null);
            }}
          />
        </label>
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">
          MCQs
          <input
            type="number"
            min={0}
            max={20}
            disabled={busy}
            className={quizFieldClass}
            value={mcqCount}
            onChange={(e) => setMcqCount(Number(e.target.value))}
          />
        </label>
        <label className="text-[12px] font-medium text-[var(--text-secondary)]">
          Written / image answers
          <input
            type="number"
            min={0}
            max={8}
            disabled={busy}
            className={quizFieldClass}
            value={writtenCount}
            onChange={(e) => setWrittenCount(Number(e.target.value))}
          />
        </label>
        <label className="text-[12px] font-medium text-[var(--text-secondary)] sm:col-span-2">
          Focus (optional)
          <input
            className={quizFieldClass}
            disabled={busy}
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. federalism, OS scheduling, Art. 32"
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 text-[12px] text-red-400">{error}</p>
      )}
      </div>
      <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[var(--border)] flex justify-end">
        <button type="button" className={quizBtnPrimary} disabled={busy} onClick={() => void start()}>
          {busy ? "Starting…" : "Generate quiz"}
        </button>
      </div>
    </div>
  );
}
