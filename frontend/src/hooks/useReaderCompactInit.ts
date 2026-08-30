"use client";

import { useEffect, useRef } from "react";

/** On phone / tablet portrait, start with overlay panels closed (not auto-open drawers). */
export function useReaderCompactInit(
  layoutCompact: boolean,
  setLibraryCollapsed: (collapsed: boolean) => void,
  setStudyAICollapsed: (collapsed: boolean) => void,
) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!layoutCompact || initialized.current) return;
    initialized.current = true;
    setLibraryCollapsed(true);
    setStudyAICollapsed(true);
  }, [layoutCompact, setLibraryCollapsed, setStudyAICollapsed]);
}
