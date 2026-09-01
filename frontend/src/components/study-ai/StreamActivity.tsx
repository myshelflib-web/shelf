"use client";

import { useEffect, useRef, useState } from "react";
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

function labelFor(raw: string) {
  return displayStreamStatusDetail(raw, false);
}

/**
 * Transient stream status — one subtle line while the model prepares an answer.
 * Hidden once answer text starts (keepAliveKey > 0). Never exported or printed.
 */
export function StreamActivity({
  events,
  live,
  keepAliveKey,
  className = "",
}: {
  events: StreamStatusEvent[];
  live: boolean;
  /** Hides activity once streamed output begins (e.g. content length). */
  keepAliveKey?: string | number;
  className?: string;
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

  if (!live) return null;
  if (typeof keepAliveKey === "number" && keepAliveKey > 0) return null;
  if (typeof keepAliveKey === "string" && keepAliveKey.length > 0) return null;

  const lastEvent = events[events.length - 1];
  const pulseLabel =
    pulseIdx >= 0 ? STREAM_PULSE_PHRASES[pulseIdx] : null;
  const currentRaw =
    pulseLabel ?? lastEvent?.detail ?? "Getting ready";
  const currentLabel = labelFor(currentRaw);

  return (
    <p
      className={`study-ai-stream-activity flex items-center gap-2 text-[11px] leading-snug text-[var(--text-muted)] ${className}`}
      data-export-ignore="true"
      aria-live="polite"
    >
      <span className="thinking-bars thinking-bars-sm" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span>{currentLabel}…</span>
    </p>
  );
}
