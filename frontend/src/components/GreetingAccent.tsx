import { Sparkles } from "lucide-react";

type AccentSize = "sm" | "md" | "lg";

const iconSize: Record<AccentSize, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

/** Soft static sparkle beside greetings (no distracting motion). */
export function GreetingAccent({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: AccentSize;
}) {
  return (
    <Sparkles
      aria-hidden
      className={`shrink-0 text-[var(--text-muted)] ${iconSize[size]} ${className}`}
    />
  );
}

/** Round ellipsis on the same line as the headline. */
export function GreetingDots({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span className={`greeting-dots ${className}`} aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}

/** Subtle waveform bars for AI thinking / loading states. */
export function ThinkingIndicator({
  label = "Thinking",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 text-sm text-[var(--text-muted)] ${className}`}
    >
      <span className="thinking-bars" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span>{label}…</span>
    </div>
  );
}
