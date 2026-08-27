"use client";

import { useEffect, useRef, useState } from "react";
import {
  useCrossfadeItems,
  useStudyAiSuggestions,
} from "@/hooks/useStudyAiSuggestions";
import type { StudyAiSuggestion } from "@/lib/studyAiSuggestions";

function ChipButton({
  item,
  disabled,
  index,
  onPick,
}: {
  item: StudyAiSuggestion;
  disabled?: boolean;
  index: number;
  onPick: (item: StudyAiSuggestion) => void;
}) {
  const action = item.tone === "action";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPick(item)}
      style={{ animationDelay: `${index * 45}ms` }}
      className={`study-ai-chip study-ai-chip-enter text-[11px] px-2.5 py-1 rounded-full border disabled:opacity-45 ${
        action
          ? "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[var(--accent-subtle)] text-[var(--accent)] hover:border-[var(--accent)]"
          : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
      }`}
    >
      {item.label}
    </button>
  );
}

function useCrossfadeText(text: string) {
  const [visible, setVisible] = useState(true);
  const [shown, setShown] = useState(text);
  const allowFade = useRef(false);

  useEffect(() => {
    if (text === shown) {
      allowFade.current = true;
      return;
    }
    if (!allowFade.current) {
      setShown(text);
      setVisible(true);
      allowFade.current = true;
      return;
    }
    setVisible(false);
    const id = window.setTimeout(() => {
      setShown(text);
      setVisible(true);
    }, 200);
    return () => window.clearTimeout(id);
  }, [text, shown]);

  return { visible, shown };
}

export function StudyAiSuggestChips({
  scope,
  count = 3,
  onPick,
  disabled,
  mode = "suggest",
  showHint = true,
  align = "start",
  className = "",
}: {
  scope: "library" | "page";
  count?: number;
  onPick: (item: StudyAiSuggestion) => void;
  disabled?: boolean;
  mode?: "suggest" | "followup";
  showHint?: boolean;
  align?: "start" | "center";
  className?: string;
}) {
  const { items, hint } = useStudyAiSuggestions(scope, count, mode);
  const { visible, shown } = useCrossfadeItems(items);
  const hintFade = useCrossfadeText(hint);

  return (
    <div className={`study-ai-suggest ${className}`.trim()}>
      {showHint && (
        <p
          className={`study-ai-suggest-hint text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)] mb-1.5 lively-line ${
            align === "center" ? "text-center" : ""
          } ${hintFade.visible ? "lively-line-in" : "lively-line-out"}`}
        >
          {hintFade.shown}
        </p>
      )}
      <div
        className={`flex flex-wrap gap-1.5 lively-line ${
          align === "center" ? "justify-center" : ""
        } ${visible ? "lively-line-in" : "lively-line-out"}`}
        role="list"
        aria-label={mode === "followup" ? "Suggested next steps" : "Suggestions"}
      >
        {shown.map((item, i) => (
          <ChipButton
            key={item.id}
            item={item}
            index={i}
            disabled={disabled}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  );
}
