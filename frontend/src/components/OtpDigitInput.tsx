"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

const LENGTH = 6;

type OtpDigitInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  "aria-label"?: string;
};

function sanitizeDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, LENGTH);
}

/** Six rounded digit boxes for verification codes (register / password reset). */
export function OtpDigitInput({
  value,
  onChange,
  disabled,
  autoFocus,
  "aria-label": ariaLabel = "Verification code",
}: OtpDigitInputProps) {
  const filled = sanitizeDigits(value);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const baseId = useId();

  const focusAt = useCallback((index: number) => {
    const el = refs.current[Math.max(0, Math.min(LENGTH - 1, index))];
    el?.focus();
    el?.select();
  }, []);

  useEffect(() => {
    if (autoFocus) focusAt(0);
  }, [autoFocus, focusAt]);

  const setFromPasteOrAutofill = (raw: string) => {
    const clean = sanitizeDigits(raw);
    onChange(clean);
    focusAt(Math.min(clean.length, LENGTH - 1));
  };

  const onDigitChange = (index: number, raw: string) => {
    const only = sanitizeDigits(raw);
    if (only.length > 1) {
      setFromPasteOrAutofill(filled.slice(0, index) + only);
      return;
    }

    const next =
      only.length === 0
        ? filled.slice(0, index) + filled.slice(index + 1)
        : filled.slice(0, index) + only + filled.slice(index + 1);

    onChange(sanitizeDigits(next));
    if (only && index < LENGTH - 1) focusAt(index + 1);
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (filled[index]) {
        onChange(filled.slice(0, index) + filled.slice(index + 1));
        focusAt(index);
      } else if (index > 0) {
        onChange(filled.slice(0, index - 1) + filled.slice(index));
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setFromPasteOrAutofill(e.clipboardData.getData("text"));
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex justify-center gap-2 sm:gap-2.5"
    >
      {Array.from({ length: LENGTH }, (_, index) => (
        <input
          key={`${baseId}-${index}`}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={LENGTH}
          disabled={disabled}
          value={filled[index] ?? ""}
          aria-label={`Digit ${index + 1} of ${LENGTH}`}
          onChange={(e) => onDigitChange(index, e.target.value)}
          onKeyDown={(e) => onKeyDown(index, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          className="h-12 w-10 sm:h-[3.25rem] sm:w-12 rounded-[10px] border border-[var(--border)] bg-[var(--bg-primary)] text-center text-xl font-semibold text-[var(--text-primary)] tabular-nums outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
        />
      ))}
    </div>
  );
}
