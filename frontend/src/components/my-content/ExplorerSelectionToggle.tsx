"use client";

import clsx from "clsx";
import { Check } from "lucide-react";

export function ExplorerSelectionToggle({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-label={checked ? "Deselect" : "Select"}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={clsx(
        "w-4 h-4 shrink-0 rounded border grid place-items-center",
        checked
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--border)] bg-[var(--bg-primary)]"
      )}
    >
      {checked ? <Check className="w-3 h-3" /> : null}
    </button>
  );
}
