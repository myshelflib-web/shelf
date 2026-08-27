"use client";

import { Check } from "lucide-react";
import { ThinkingIndicator } from "@/components/GreetingAccent";

export type StreamStatusEvent = {
  stage: string;
  detail: string;
};

function labelFor(detail: string) {
  return detail.replace(/…+$/, "").trim() || "Working";
}

export function StreamActivity({
  events,
  live,
}: {
  events: StreamStatusEvent[];
  live: boolean;
}) {
  if (events.length === 0) {
    return live ? <ThinkingIndicator label="Thinking" /> : null;
  }

  return (
    <ul className="space-y-1.5" aria-live="polite">
      {events.map((event, i) => {
        const current = live && i === events.length - 1;
        return (
          <li
            key={`${event.stage}-${i}`}
            className="study-ai-status-item"
            style={{ animationDelay: `${Math.min(i, 4) * 40}ms` }}
          >
            {current ? (
              <ThinkingIndicator label={labelFor(event.detail)} />
            ) : (
              <p className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                <Check className="w-3 h-3 shrink-0 text-[var(--accent)]" />
                <span>{event.detail}</span>
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
