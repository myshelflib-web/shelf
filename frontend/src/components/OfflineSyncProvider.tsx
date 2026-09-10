"use client";

import { useEffect } from "react";
import { flushOfflineSync } from "@/lib/offline/sync";
import { scheduleFlushOfflineSync } from "@/lib/flushPendingMutations";
import { OFFLINE_STATUS_EVENT, dispatchOfflineStatus } from "@/lib/offline/network";

/** Flush queued mutations when the device comes back online. */
export function OfflineSyncProvider() {
  useEffect(() => {
    const run = () => {
      void flushOfflineSync();
    };

    run();
    window.addEventListener("online", run);
    window.addEventListener("offline", () => dispatchOfflineStatus());
    window.addEventListener(OFFLINE_STATUS_EVENT, run);
    // Wake soon after mount in case deferred uploads/mutations were left mid-backoff.
    scheduleFlushOfflineSync(1_500);
    return () => {
      window.removeEventListener("online", run);
      window.removeEventListener("offline", () => dispatchOfflineStatus());
      window.removeEventListener(OFFLINE_STATUS_EVENT, run);
    };
  }, []);

  return null;
}
