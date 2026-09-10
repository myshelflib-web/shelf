"use client";

import { useEffect, useRef, useState } from "react";
import { Cloud, CloudOff, Loader2, Upload } from "lucide-react";
import { countAllPending } from "@/lib/offline/outbox";
import {
  OFFLINE_STATUS_EVENT,
  OFFLINE_SYNC_EVENT,
  isOnline,
} from "@/lib/offline/network";
import {
  ACTION_ERROR_EVENT,
  OFFLINE_NOTICE_EVENT,
} from "@/lib/offline/notice";
import {
  SYNC_STATUS_EVENT,
  syncStatusFromEvent,
  type SyncStatusDetail,
} from "@/lib/syncStatus";
import { useAuth } from "@/hooks/useAuth";

type BadgeView = {
  label: string;
  title: string;
  icon: "offline" | "upload" | "sync" | "ok" | "error";
};

const ERROR_HOLD_MS = 6_000;

function viewFromActivity(
  online: boolean,
  pending: number,
  activity: SyncStatusDetail | null
): BadgeView {
  if (!online) {
    return {
      label: pending > 0 ? `Offline · ${pending}` : "Offline",
      title:
        pending > 0
          ? `${pending} change${pending === 1 ? "" : "s"} will sync when you're back online`
          : "You're offline",
      icon: "offline",
    };
  }

  if (activity?.state === "uploading") {
    const pct =
      activity.percent != null && activity.percent > 0
        ? ` ${activity.percent}%`
        : "";
    return {
      label: activity.label ? `${activity.label}${pct}` : `Uploading${pct}…`,
      title: "Uploading to Shelf",
      icon: "upload",
    };
  }

  if (activity?.state === "saving") {
    return {
      label: activity.label ?? "Syncing…",
      title: "Saving changes",
      icon: "sync",
    };
  }

  if (activity?.state === "error") {
    return {
      label: activity.label ?? "Sync failed",
      title: activity.label ?? "Could not sync changes",
      icon: "error",
    };
  }

  if (pending > 0) {
    return {
      label: `Syncing ${pending}…`,
      title: `Syncing ${pending} pending change${pending === 1 ? "" : "s"}`,
      icon: "sync",
    };
  }

  if (activity?.state === "synced") {
    return {
      label: "Synced",
      title: "All changes saved",
      icon: "ok",
    };
  }

  return {
    label: "Synced",
    title: "All changes saved",
    icon: "ok",
  };
}

/**
 * Always-visible header cloud chip (signed-in): offline / uploading /
 * syncing / synced / failed.
 */
export function OfflineStatusBadge() {
  const { user } = useAuth();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [activity, setActivity] = useState<SyncStatusDetail | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    const clearLater = (ms: number) => {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setActivity(null), ms);
    };

    const onSync = (e: Event) => {
      const detail = syncStatusFromEvent(e);
      if (!detail) return;
      if (detail.state === "idle") {
        setActivity(null);
        return;
      }
      setActivity(detail);
      // Keep "Synced" flash briefly, then fall back to idle Synced label.
      if (detail.state === "synced") clearLater(2_400);
      if (detail.state === "error") clearLater(ERROR_HOLD_MS);
      if (detail.state === "uploading" || detail.state === "saving") {
        if (clearTimer.current) clearTimeout(clearTimer.current);
      }
    };

    const onActionError = () => {
      setActivity({ state: "error", label: "Sync failed" });
      clearLater(ERROR_HOLD_MS);
    };

    const onOfflineNotice = () => {
      setOnline(false);
    };

    window.addEventListener(SYNC_STATUS_EVENT, onSync);
    window.addEventListener(ACTION_ERROR_EVENT, onActionError);
    window.addEventListener(OFFLINE_NOTICE_EVENT, onOfflineNotice);
    return () => {
      window.removeEventListener(SYNC_STATUS_EVENT, onSync);
      window.removeEventListener(ACTION_ERROR_EVENT, onActionError);
      window.removeEventListener(OFFLINE_NOTICE_EVENT, onOfflineNotice);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  if (!user) return null;

  const view = viewFromActivity(online, pending, activity);

  const Icon =
    view.icon === "offline"
      ? CloudOff
      : view.icon === "upload"
        ? Upload
        : view.icon === "ok"
          ? Cloud
          : view.icon === "error"
            ? CloudOff
            : view.icon === "sync"
              ? Loader2
              : Cloud;

  const spinning = view.icon === "sync";
  const tone =
    view.icon === "error"
      ? "border-red-500/35 text-red-400"
      : view.icon === "ok"
        ? "border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] text-[var(--accent)]"
        : "border-[var(--border)] text-[var(--text-secondary)]";

  return (
    <span
      className={`hidden sm:inline-flex items-center gap-1.5 rounded-[10px] border bg-[var(--bg-secondary)] px-2 py-1 text-[11px] ${tone}`}
      title={view.title}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={`h-3.5 w-3.5 shrink-0${
          view.icon === "ok" || view.icon === "error"
            ? ""
            : " text-[var(--text-muted)]"
        }${spinning ? " animate-spin" : ""}`}
        aria-hidden
      />
      {view.label}
    </span>
  );
}
