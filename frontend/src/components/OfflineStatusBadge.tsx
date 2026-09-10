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
import {
  SYNC_ACTIVITY_EVENT,
  listSyncActivities,
  type SyncActivityItem,
} from "@/lib/syncActivityStore";
import { collectSyncActivitySnapshot } from "@/lib/collectSyncActivitySnapshot";
import { SyncActivityPanel } from "@/components/SyncActivityPanel";
import { useAuth } from "@/hooks/useAuth";

type BadgeView = {
  label: string;
  title: string;
  icon: "offline" | "upload" | "sync" | "ok" | "error";
};

function viewFromActivity(
  online: boolean,
  pending: number,
  activity: SyncStatusDetail | null,
  stickyError: boolean,
  errorItems: number
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

  const parkedOnly =
    pending > 0 && errorItems > 0 && errorItems >= pending;
  const showFailure =
    activity?.state === "error" ||
    stickyError ||
    parkedOnly ||
    (pending > 0 && errorItems > 0 && activity?.state !== "uploading");

  if (
    activity?.state === "uploading" &&
    !parkedOnly &&
    errorItems < pending
  ) {
    const pct =
      activity.percent != null && activity.percent > 0
        ? ` ${activity.percent}%`
        : "";
    return {
      label: activity.label ? `${activity.label}${pct}` : `Uploading${pct}…`,
      title: "Uploading to Shelf — click for details",
      icon: "upload",
    };
  }

  if (activity?.state === "saving" && !showFailure) {
    return {
      label: activity.label ?? "Syncing…",
      title: "Saving changes — click for details",
      icon: "sync",
    };
  }

  if (showFailure && pending > 0) {
    return {
      label: pending > 1 ? `Not synced · ${pending}` : "Not synced",
      title: "Some changes could not sync — click for details",
      icon: "error",
    };
  }

  if (activity?.state === "error") {
    return {
      label: activity.label ?? "Not synced",
      title: "Some changes could not sync — click for details",
      icon: "error",
    };
  }

  if (pending > 0) {
    return {
      label: `Syncing ${pending}…`,
      title: `Syncing ${pending} pending change${pending === 1 ? "" : "s"} — click for details`,
      icon: "sync",
    };
  }

  if (activity?.state === "synced") {
    return {
      label: "Synced",
      title: "All changes saved — click for details",
      icon: "ok",
    };
  }

  return {
    label: "Synced",
    title: "All changes saved — click for details",
    icon: "ok",
  };
}

/**
 * Always-visible header cloud chip (signed-in). Click for a dropdown of
 * background uploads and pending sync work.
 */
export function OfflineStatusBadge() {
  const { user } = useAuth();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [activity, setActivity] = useState<SyncStatusDetail | null>(null);
  const [stickyError, setStickyError] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SyncActivityItem[]>([]);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = () => {
      setOnline(isOnline());
      void countAllPending(user?.id).then((n) => {
        setPending(n);
        if (n === 0) setStickyError(false);
      });
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
    const refreshItems = () => {
      void collectSyncActivitySnapshot().then(setItems);
    };
    refreshItems();
    window.addEventListener(SYNC_ACTIVITY_EVENT, refreshItems);
    window.addEventListener(OFFLINE_SYNC_EVENT, refreshItems);
    return () => {
      window.removeEventListener(SYNC_ACTIVITY_EVENT, refreshItems);
      window.removeEventListener(OFFLINE_SYNC_EVENT, refreshItems);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    void collectSyncActivitySnapshot().then(setItems);
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
      if (detail.state === "error") {
        setStickyError(true);
        void countAllPending(user?.id).then((n) => {
          if (n === 0) clearLater(6_000);
          else if (clearTimer.current) clearTimeout(clearTimer.current);
        });
        return;
      }
      if (detail.state === "synced") {
        void countAllPending(user?.id).then((n) => {
          if (n === 0) {
            setStickyError(false);
            clearLater(2_400);
          } else {
            // Pending parked failures remain — keep Not synced, don't flash Synced.
            setStickyError(true);
            setActivity({ state: "error", label: "Not synced" });
          }
        });
      }
      if (detail.state === "uploading" || detail.state === "saving") {
        if (clearTimer.current) clearTimeout(clearTimer.current);
      }
    };

    const onActionError = () => {
      setStickyError(true);
      setActivity({ state: "error", label: "Not synced" });
      void countAllPending(user?.id).then((n) => {
        if (n === 0) clearLater(6_000);
      });
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
  }, [user?.id]);

  if (!user) return null;

  const errorItems = items.filter((a) => a.status === "error").length;
  const view = viewFromActivity(
    online,
    pending,
    activity,
    stickyError,
    errorItems
  );
  const liveCount = items.length || listSyncActivities().filter((a) => a.status !== "done").length;

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
    <div className="relative hidden sm:block" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded-[10px] border bg-[var(--bg-secondary)] px-2 py-1 text-[11px] ${tone} hover:bg-[var(--bg-elevated)] transition-colors`}
        title={view.title}
        aria-label="Sync status"
        aria-expanded={open}
        aria-haspopup="dialog"
        data-tour-id="hdr-sync"
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
        {liveCount > 0 && view.icon !== "upload" && view.icon !== "sync" ? (
          <span className="ml-0.5 rounded-full bg-[var(--bg-primary)] px-1 text-[9px] text-[var(--text-muted)]">
            {liveCount > 9 ? "9+" : liveCount}
          </span>
        ) : null}
      </button>
      {open ? <SyncActivityPanel items={items} online={online} /> : null}
    </div>
  );
}
