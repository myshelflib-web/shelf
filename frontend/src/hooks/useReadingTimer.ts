"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { tickReading } from "@/lib/readingStats";
import {
  createReadingSession,
  shouldCountReading,
} from "@/lib/readingSession";

function currentHref() {
  return `${window.location.pathname}${window.location.search}`;
}

export function useReadingTimer(active = true) {
  const pathname = usePathname();

  useEffect(() => {
    const session = createReadingSession({ commit: tickReading });

    const sync = () => {
      if (
        shouldCountReading({
          active,
          href: currentHref(),
          visibilityState: document.visibilityState,
        })
      ) {
        session.start();
        return;
      }
      session.stop();
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pagehide", sync);
    window.addEventListener("pageshow", sync);
    window.addEventListener("popstate", sync);

    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pagehide", sync);
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("popstate", sync);
      session.stop();
    };
  }, [active, pathname]);
}
