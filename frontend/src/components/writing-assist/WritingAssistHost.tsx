"use client";

import { useEffect, useState } from "react";
import { subscribeWritingAssist } from "@/lib/writingAssistBus";
import type { WritingAssistOpen } from "@/lib/writingAssistTypes";
import { WritingAssistModal } from "./WritingAssistModal";

/** Listens for selection-chrome / doc-toolbar writing assist opens. */
export function WritingAssistHost() {
  const [payload, setPayload] = useState<WritingAssistOpen | null>(null);

  useEffect(() => subscribeWritingAssist(setPayload), []);

  if (!payload) return null;
  return (
    <WritingAssistModal payload={payload} onClose={() => setPayload(null)} />
  );
}
