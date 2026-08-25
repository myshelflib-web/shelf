"use client";

import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";
import { countAllPending } from "@/lib/offline/outbox";
import {
  OFFLINE_STATUS_EVENT,
  OFFLINE_SYNC_EVENT,
  isOnline,
} from "@/lib/offline/network";
import { useAuth } from "@/hooks/useAuth";

export function OfflineStatusBadge() {
  const { user } = useAuth();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setOnline(isOnline());
      void countAllPending(user?.id).then(setPending);
    };
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener(OFFLINE_STATUS_EVENT, refresh);
    window.addEventListener(OFFLINE_SYNC_EVENT, refresh);
    window.addEventListener("shelf:tasks-changed", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener(OFFLINE_STATUS_EVENT, refresh);
      window.removeEventListener(OFFLINE_SYNC_EVENT, refresh);
      window.removeEventListener("shelf:tasks-changed", refresh);
    };
  }, [user?.id]);

  if (!user || (online && pending === 0)) return null;

  const label = online
    ? pending > 0
      ? `Syncing ${pending} change${pending === 1 ? "" : "s"}…`
      : null
    : pending > 0
      ? `Offline · ${pending} pending`
      : "Offline";

  if (!label) return null;

  return (
    <span
      className="hidden sm:inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-[11px] text-[var(--text-secondary)]"
      title={label}
    >
      <CloudOff className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
      {label}
    </span>
  );
}
