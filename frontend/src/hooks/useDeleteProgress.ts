"use client";

import { useSyncExternalStore } from "react";
import {
  getDeleteProgressJobs,
  subscribeDeleteProgress,
  type DeleteProgressJob,
} from "@/lib/deleteProgress";

function getSnapshot(): readonly DeleteProgressJob[] {
  return getDeleteProgressJobs();
}

function getServerSnapshot(): readonly DeleteProgressJob[] {
  return [];
}

export function useDeleteProgress(): readonly DeleteProgressJob[] {
  return useSyncExternalStore(
    subscribeDeleteProgress,
    getSnapshot,
    getServerSnapshot
  );
}
