"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { scheduleFlushOfflineSync } from "@/lib/flushPendingMutations";
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
      title: "Some changes could not sync — click to retry / dismiss",
      icon: "error",
    };
  }

  if (activity?.state === "error") {
    return {
      label: activity.label ?? "Not synced",
      title: "Some changes could not sync — click to retry / dismiss",
      icon: "error",
    };
  }

  // Pending without an active upload — show Not synced (not endless Syncing spin).
  if (pending > 0) {
    return {
      label: pending > 1 ? `Not synced · ${pending}` : "Not synced",
      title: "Pending changes — click to sync and view details",
      icon: "error",
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
 * Always-visible header cloud chip (signed-in). Click opens details and
 * wakes a flush. Panel portals above modals so it stays clickable during import.
 */
export function OfflineStatusBadge() {
  const { user } = useAuth();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [activity, setActivity] = useState<SyncStatusDetail | null>(null);
  const [stickyError, setStickyError] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SyncActivityItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const refreshItems = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        debounce = null;
        void collectSyncActivitySnapshot().then(setItems);
      }, 200);
    };
    refreshItems();
    window.addEventListener(SYNC_ACTIVITY_EVENT, refreshItems);
    window.addEventListener(OFFLINE_SYNC_EVENT, refreshItems);
    return () => {
      if (debounce) clearTimeout(debounce);
      window.removeEventListener(SYNC_ACTIVITY_EVENT, refreshItems);
      window.removeEventListener(OFFLINE_SYNC_EVENT, refreshItems);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    void collectSyncActivitySnapshot().then(setItems);
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (
        t instanceof Element &&
        t.closest("[data-tour-id='sync-panel-portal']")
      ) {
        return;
      }
      setOpen(false);
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
  const liveCount =
    items.length ||
    listSyncActivities().filter((a) => a.status !== "done").length;

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

  const spinning = view.icon === "sync" || view.icon === "upload";
  const tone =
    view.icon === "error"
      ? "border-red-500/35 text-red-400"
      : view.icon === "ok"
        ? "border-[color-mix(in_srgb,var(--accent)_28%,var(--border))] text-[var(--accent)]"
        : "border-[var(--border)] text-[var(--text-secondary)]";

  const onToggle = () => {
    setOpen((v) => !v);
    // Click always wakes flush — chip is the manual sync control.
    if (online) scheduleFlushOfflineSync(0);
    void collectSyncActivitySnapshot().then(setItems);
  };

  const chip = (
    <div
      className="relative z-[80]"
      ref={wrapRef}
      data-tour-id="hdr-sync-wrap"
    >
      <button
        type="button"
        onClick={onToggle}
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
        <span className="hidden sm:inline">{view.label}</span>
        {liveCount > 0 && view.icon !== "upload" && view.icon !== "sync" ? (
          <span className="ml-0.5 rounded-full bg-[var(--bg-primary)] px-1 text-[9px] text-[var(--text-muted)]">
            {liveCount > 9 ? "9+" : liveCount}
          </span>
        ) : null}
      </button>
      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[90]"
              data-tour-id="sync-panel-portal"
            >
              <button
                type="button"
                className="absolute inset-0 cursor-default bg-transparent"
                aria-label="Close sync panel"
                onClick={() => setOpen(false)}
              />
              <div
                className="absolute right-3 top-14 sm:right-6"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <SyncActivityPanel items={items} online={online} />
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );

  return chip;
}
