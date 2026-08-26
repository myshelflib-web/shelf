"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";

const actionClass =
  "inline-flex items-center gap-1.5 h-[29px] px-2 rounded-[7px] text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors";

export function MessageActionButton({
  label,
  onClick,
  icon,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  icon: "copy" | "copied" | "delete";
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`${actionClass} ${danger ? "hover:text-red-400" : ""}`}
      onClick={onClick}
      aria-label={label}
    >
      {icon === "copy" ? (
        <Copy className="w-3 h-3" />
      ) : icon === "copied" ? (
        <Check className="w-3 h-3" />
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
      {label}
    </button>
  );
}

export function DeleteMessageButton({
  onDelete,
  disabled,
}: {
  onDelete: () => void;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  const click = useCallback(() => {
    if (disabled) return;
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 2200);
      return;
    }
    setConfirming(false);
    onDelete();
  }, [confirming, disabled, onDelete]);

  return (
    <MessageActionButton
      label={confirming ? "Confirm" : "Delete"}
      onClick={click}
      icon="delete"
      danger
    />
  );
}
