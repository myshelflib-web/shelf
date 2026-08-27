"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { positionMenuBelow } from "@/lib/ui/positionMenuBelow";

export type ShelfSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type ShelfSelectGroup = {
  label: string;
  options: ShelfSelectOption[];
};

function flattenOptions(
  options?: ShelfSelectOption[],
  groups?: ShelfSelectGroup[]
): ShelfSelectOption[] {
  const fromOptions = options ?? [];
  const fromGroups = groups?.flatMap((g) => g.options) ?? [];
  return [...fromOptions, ...fromGroups];
}

function labelForValue(
  value: string,
  options?: ShelfSelectOption[],
  groups?: ShelfSelectGroup[]
): string {
  return flattenOptions(options, groups).find((o) => o.value === value)?.label ?? "";
}

type ShelfSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options?: ShelfSelectOption[];
  groups?: ShelfSelectGroup[];
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  compact?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  id?: string;
  onTriggerMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

export function ShelfSelect({
  value,
  onChange,
  options,
  groups,
  disabled = false,
  className = "",
  menuClassName = "",
  compact = false,
  placeholder = "Select…",
  "aria-label": ariaLabel,
  id,
  onTriggerMouseDown,
}: ShelfSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setOpen(false);
    setMenuReady(false);
  }, []);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    positionMenuBelow(menu, trigger, { minWidth: trigger.offsetWidth });
    setMenuReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    setMenuReady(false);
    reposition();
    const raf = window.requestAnimationFrame(reposition);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, reposition, options, groups, value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      close();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onPointer, true);
    };
  }, [open, close]);

  const pick = (next: string) => {
    onChange(next);
    close();
  };

  const handleTriggerMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onTriggerMouseDown?.(e);
  };

  const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!disabled) setOpen((v) => !v);
  };

  const selectedLabel = labelForValue(value, options, groups);
  const display = selectedLabel || placeholder;

  const renderOption = (opt: ShelfSelectOption) => {
    const selected = opt.value === value;
    return (
      <button
        key={opt.value}
        type="button"
        role="option"
        aria-selected={selected}
        disabled={opt.disabled}
        className={`shelf-select-option${selected ? " is-selected" : ""}`}
        onClick={() => !opt.disabled && pick(opt.value)}
      >
        <Check className="shelf-select-option-check" aria-hidden />
        <span className="truncate">{opt.label}</span>
      </button>
    );
  };

  const menu =
    open && mounted ? (
      <div
        ref={menuRef}
        id={listId}
        role="listbox"
        aria-label={ariaLabel}
        data-shelf-select-menu=""
        className={`shelf-select-menu${menuReady ? " is-ready" : ""}${menuClassName ? ` ${menuClassName}` : ""}`.trim()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {options?.map(renderOption)}
        {groups?.map((group) => (
          <div key={group.label} className="shelf-select-group">
            <div className="shelf-select-group-label">{group.label}</div>
            {group.options.map(renderOption)}
          </div>
        ))}
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        data-shelf-select=""
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        className={`shelf-select-trigger${compact ? " shelf-select-trigger-compact" : ""}${open ? " is-open" : ""} ${className}`.trim()}
        onMouseDown={handleTriggerMouseDown}
        onClick={handleTriggerClick}
      >
        <span className={`shelf-select-value truncate${selectedLabel ? "" : " is-placeholder"}`}>
          {display}
        </span>
        <ChevronDown className="shelf-select-chevron" aria-hidden />
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </>
  );
}
