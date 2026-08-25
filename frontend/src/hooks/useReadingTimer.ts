"use client";

import { useEffect } from "react";
import { tickReading } from "@/lib/readingStats";

export function useReadingTimer(active = true) {
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => tickReading(30), 30000);
    return () => window.clearInterval(id);
  }, [active]);
}
