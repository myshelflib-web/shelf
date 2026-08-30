"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Subject } from "@/types";

let cached: Subject[] | null = null;
let inflight: Promise<Subject[]> | null = null;

function fetchSubjects(force: boolean): Promise<Subject[]> {
  if (!force && cached) return Promise.resolve(cached);
  if (!force && inflight) return inflight;
  inflight = api.subjects
    .list()
    .then((res) => {
      cached = res.subjects;
      return cached;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Shared curriculum list — paints from memory cache, revalidates in the background. */
export function useLearnSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);

  const reload = useCallback((force = false) => {
    if (!cached) setLoading(true);
    return fetchSubjects(force)
      .then((list) => setSubjects(list))
      .catch(() => {
        if (!cached) setSubjects([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { subjects, loading, reload };
}
