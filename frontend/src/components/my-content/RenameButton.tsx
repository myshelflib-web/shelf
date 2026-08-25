"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

export function RenameButton({
  label,
  onRename,
  className = "",
  textClassName = "",
  iconClassName = "w-3.5 h-3.5",
  href,
  onLabelClick,
}: {
  label: string;
  onRename: (next: string) => Promise<void> | void;
  className?: string;
  /** Styles applied to the visible title (and matching input). */
  textClassName?: string;
  iconClassName?: string;
  /** Optional link when not editing (e.g. open notebook). */
  href?: string;
  /** Click handler for the label when `href` is not set. */
  onLabelClick?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(label);
  }, [label]);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editing]);

  const commit = async () => {
    const next = value.trim();
    if (!next || next === label) {
      setValue(label);
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onRename(next);
      setEditing(false);
    } catch {
      setValue(label);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        disabled={saving}
        aria-label="Rename"
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commit();
          }
          if (e.key === "Escape") {
            setValue(label);
            setEditing(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full min-w-0 bg-transparent outline-none border-0 border-b border-[var(--accent)] rounded-none px-0 py-0 ${textClassName} ${className}`}
      />
    );
  }

  return (
    <span
      className={`group/rename inline-flex items-center gap-1 min-w-0 max-w-full ${className}`}
    >
      {href ? (
        <Link
          href={href}
          className={`truncate min-w-0 hover:opacity-70 ${textClassName}`}
          title={label}
        >
          {label}
        </Link>
      ) : onLabelClick ? (
        <button
          type="button"
          onClick={onLabelClick}
          className={`truncate min-w-0 text-left hover:opacity-70 ${textClassName}`}
          title={label}
        >
          {label}
        </button>
      ) : (
        <span className={`truncate min-w-0 ${textClassName}`} title={label}>
          {label}
        </span>
      )}
      <button
        type="button"
        title="Rename"
        aria-label={`Rename ${label}`}
        className="p-0.5 rounded text-[var(--text-muted)] opacity-0 group-hover/rename:opacity-100 focus-visible:opacity-100 hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] shrink-0 transition-opacity"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setEditing(true);
        }}
      >
        <Pencil className={iconClassName} />
      </button>
    </span>
  );
}
