"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import {
  STREAM_PULSE_PHRASES,
  displayStreamStatusDetail,
} from "@/lib/studyAiStreamLabels";

export type StreamStatusEvent = {
  stage: string;
  detail: string;
};

const PULSE_IDLE_MS = 1800;
const PULSE_ROTATE_MS = 2600;

function labelFor(raw: string, done: boolean) {
  return displayStreamStatusDetail(raw, done);
}

export function StreamActivity({
  events,
  live,
  compact = false,
  keepAliveKey,
}: {
  events: StreamStatusEvent[];
  live: boolean;
  compact?: boolean;
  /** Resets idle pulse when streamed output grows (e.g. content length). */
  keepAliveKey?: string | number;
}) {
  const lastEventAtRef = useRef(Date.now());
  const [pulseIdx, setPulseIdx] = useState(-1);

  useEffect(() => {
    lastEventAtRef.current = Date.now();
    setPulseIdx(-1);
  }, [events, keepAliveKey]);

  useEffect(() => {
    if (!live) {
      setPulseIdx(-1);
      return;
    }
    const id = window.setInterval(() => {
      const idle = Date.now() - lastEventAtRef.current;
      if (idle < PULSE_IDLE_MS) {
        setPulseIdx(-1);
        return;
      }
      setPulseIdx((i) => (i + 1) % STREAM_PULSE_PHRASES.length);
    }, PULSE_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [live]);

  const lastEvent = events[events.length - 1];
  const pulseLabel =
    pulseIdx >= 0 ? STREAM_PULSE_PHRASES[pulseIdx] : null;
  const currentRaw =
    pulseLabel ?? lastEvent?.detail ?? (live ? "Getting ready" : "Working");
  const currentLabel = labelFor(currentRaw, false);

  if (events.length === 0) {
    return live ? (
      <ThinkingIndicator
        label={currentLabel}
        className={compact ? "text-[11px]" : undefined}
      />
    ) : null;
  }

  const textClass = compact
    ? "text-[11px] text-[var(--text-muted)]"
    : "text-[12px] text-[var(--text-muted)]";

  return (
    <ul
      className={compact ? "space-y-1" : "space-y-1.5"}
      aria-live="polite"
      aria-label="Study AI activity"
    >
      {events.slice(-5).map((event, i, slice) => {
        const absoluteIndex = events.length - slice.length + i;
        const isLast = absoluteIndex === events.length - 1;
        const current = live && isLast;
        const detail = current
          ? currentLabel
          : labelFor(event.detail, true);
        return (
          <li
            key={`${event.stage}-${absoluteIndex}-${event.detail}`}
            className="study-ai-status-item"
            style={{ animationDelay: `${Math.min(i, 4) * 40}ms` }}
          >
            {current ? (
              <ThinkingIndicator
                label={detail}
                className={compact ? "text-[11px]" : undefined}
              />
            ) : (
              <p className={`flex items-center gap-2 ${textClass}`}>
                <Check className="w-3 h-3 shrink-0 text-[var(--accent)]" />
                <span>{detail}</span>
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
