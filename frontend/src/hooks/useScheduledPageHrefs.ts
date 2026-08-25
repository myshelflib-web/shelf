"use client";

import { useEffect, useState } from "react";
import { listTasks } from "@/lib/offline/tasks";

/** Open (incomplete) library page hrefs that have a calendar TASK. */
export function useScheduledPageHrefs(enabled = true): Set<string> {
  const [hrefs, setHrefs] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!enabled) return;

    const load = () => {
      const from = new Date();
      from.setMonth(from.getMonth() - 2);
      const to = new Date();
      to.setFullYear(to.getFullYear() + 2);
      listTasks(from.toISOString(), to.toISOString())
        .then((tasks) => {
          const next = new Set<string>();
          for (const t of tasks) {
            if (t.kind === "EVENT" || t.completed) continue;
            const href = t.href?.trim();
            if (href?.startsWith("/my-content/")) next.add(href);
          }
          setHrefs(next);
        })
        .catch(() => setHrefs(new Set()));
    };

    load();
    window.addEventListener("shelf:tasks-changed", load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("shelf:tasks-changed", load);
      window.removeEventListener("focus", load);
    };
  }, [enabled]);

  return hrefs;
}

export { pageHref } from "@/lib/myContentTree";
