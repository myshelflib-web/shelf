"use client";

import { useEffect, useRef, useState } from "react";
import { useStudyAiSuggestions } from "@/hooks/useStudyAiSuggestions";
import type { StudyAiSuggestion } from "@/lib/studyAiSuggestions";

export function StudyAiSuggestChips({
  scope,
  count = 3,
  onPick,
  disabled,
}: {
  scope: "library" | "page";
  count?: number;
  onPick: (item: StudyAiSuggestion) => void;
  disabled?: boolean;
}) {
  const items = useStudyAiSuggestions(scope, count);
  const [visible, setVisible] = useState(true);
  const [shown, setShown] = useState(items);
  const allowFade = useRef(false);
  const key = items.map((i) => i.id).join("|");
  const shownKey = shown.map((i) => i.id).join("|");

  useEffect(() => {
    if (key === shownKey) {
      allowFade.current = true;
      return;
    }
    if (!allowFade.current) {
      setShown(items);
      setVisible(true);
      allowFade.current = true;
      return;
    }
    setVisible(false);
    const id = window.setTimeout(() => {
      setShown(items);
      setVisible(true);
    }, 180);
    return () => window.clearTimeout(id);
  }, [key, shownKey, items]);

  return (
    <div
      className={`flex flex-wrap gap-1.5 lively-line ${
        visible ? "lively-line-in" : "lively-line-out"
      }`}
    >
      {shown.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(item)}
          className="study-ai-chip text-[11px] px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-45 transition-colors"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
