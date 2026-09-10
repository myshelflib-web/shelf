"use client";

import { useEffect } from "react";
import { scheduleFlushOfflineSync } from "@/lib/flushPendingMutations";
import { dispatchOfflineStatus } from "@/lib/offline/network";

/**
 * Wake deferred upload/mutation flushes after load / reconnect.
 * Intentionally does not flush on OFFLINE_STATUS_EVENT — that re-entered
 * flush → status → flush and fought Upload after sync retries landed.
 */
export function OfflineSyncProvider() {
  useEffect(() => {
    const onOnline = () => {
      scheduleFlushOfflineSync(500);
    };
    const onOffline = () => {
      dispatchOfflineStatus();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    // Idle wake only — never block first paint / Upload click with an IDB flush.
    scheduleFlushOfflineSync(5_000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return null;
}
