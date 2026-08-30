"use client";

import { useEffect, useMemo, useState } from "react";
import { useCrossfadeItems } from "@/hooks/useStudyAiSuggestions";
import {
  getOrCreateSessionSeed,
  livelySlot,
} from "@/lib/livelyCopy";
import {
  LIBRARY_SUGGEST_COUNT,
  LIBRARY_SUGGEST_ROTATE_MS,
  pickLibrarySuggestChips,
  type LibrarySuggestChip,
  type SuggestSurface,
} from "@/lib/librarySearchSuggestions";

export function LibrarySuggestChips({
  surface,
  onPick,
  className = "",
}: {
  surface: SuggestSurface;
  onPick: (item: LibrarySuggestChip) => void;
  className?: string;
}) {
  const [seed] = useState(() =>
    typeof window === "undefined" ? "ssr" : getOrCreateSessionSeed()
  );
  const [slot, setSlot] = useState(() =>
    livelySlot(Date.now(), LIBRARY_SUGGEST_ROTATE_MS)
  );

  useEffect(() => {
    const id = window.setInterval(
      () => setSlot(livelySlot(Date.now(), LIBRARY_SUGGEST_ROTATE_MS)),
      Math.min(LIBRARY_SUGGEST_ROTATE_MS, 5_000)
    );
    return () => window.clearInterval(id);
  }, []);

  const items = useMemo(
    () =>
      pickLibrarySuggestChips(surface, {
        slot,
        sessionSeed: seed,
        count: LIBRARY_SUGGEST_COUNT,
      }),
    [surface, slot, seed]
  );
  const { visible, shown } = useCrossfadeItems(items);

  return (
    <div
      className={`w-full min-h-[4.25rem] lively-line ${
        visible ? "lively-line-in" : "lively-line-out"
      } ${className}`.trim()}
      role="list"
      aria-label="Search suggestions"
    >
      <div className="flex flex-wrap gap-1.5">
        {shown.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="listitem"
            onClick={() => onPick(item)}
            style={{ animationDelay: `${i * 45}ms` }}
            className="study-ai-chip study-ai-chip-enter text-[12px] px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
