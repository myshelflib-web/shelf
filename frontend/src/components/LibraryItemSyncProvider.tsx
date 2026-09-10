"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  OFFLINE_STATUS_EVENT,
  OFFLINE_SYNC_EVENT,
} from "@/lib/offline/network";
import { ACTION_ERROR_EVENT } from "@/lib/offline/notice";
import {
  collectPendingPageIds,
  resolveFolderSyncVisual,
  resolveItemSyncVisual,
  type ItemSyncVisual,
} from "@/lib/offline/pendingPageSync";
import {
  SYNC_STATUS_EVENT,
  syncStatusFromEvent,
} from "@/lib/syncStatus";

type LibraryItemSyncValue = {
  pageStatus: (pageId: string) => ItemSyncVisual;
  folderStatus: (pageIds: string[]) => ItemSyncVisual;
};

const LibraryItemSyncContext = createContext<LibraryItemSyncValue | null>(
  null
);

const EMPTY = new Set<string>();

export function LibraryItemSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pending, setPending] = useState<Set<string>>(EMPTY);
  const [failed, setFailed] = useState<Set<string>>(EMPTY);

  const refresh = useCallback(() => {
    if (!user?.id) {
      setPending(EMPTY);
      return;
    }
    void collectPendingPageIds(user.id).then(setPending);
  }, [user?.id]);

  useEffect(() => {
    refresh();
    window.addEventListener(OFFLINE_SYNC_EVENT, refresh);
    window.addEventListener(OFFLINE_STATUS_EVENT, refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("shelf:tasks-changed", refresh);
    return () => {
      window.removeEventListener(OFFLINE_SYNC_EVENT, refresh);
      window.removeEventListener(OFFLINE_STATUS_EVENT, refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("shelf:tasks-changed", refresh);
    };
  }, [refresh]);

  useEffect(() => {
    const onSync = (e: Event) => {
      const detail = syncStatusFromEvent(e);
      if (!detail) return;
      if (detail.state === "synced" || detail.state === "idle") {
        setFailed(EMPTY);
        refresh();
      }
      if (detail.state === "error") {
        setPending((prev) => {
          setFailed(new Set(prev));
          return prev;
        });
      }
      if (detail.state === "saving" || detail.state === "uploading") {
        refresh();
      }
    };
    const onActionError = () => {
      setPending((prev) => {
        setFailed(new Set(prev));
        return prev;
      });
    };
    window.addEventListener(SYNC_STATUS_EVENT, onSync);
    window.addEventListener(ACTION_ERROR_EVENT, onActionError);
    return () => {
      window.removeEventListener(SYNC_STATUS_EVENT, onSync);
      window.removeEventListener(ACTION_ERROR_EVENT, onActionError);
    };
  }, [refresh]);

  const value = useMemo<LibraryItemSyncValue>(
    () => ({
      pageStatus: (pageId) => resolveItemSyncVisual(pageId, pending, failed),
      folderStatus: (pageIds) =>
        resolveFolderSyncVisual(pageIds, pending, failed),
    }),
    [pending, failed]
  );

  return (
    <LibraryItemSyncContext.Provider value={value}>
      {children}
    </LibraryItemSyncContext.Provider>
  );
}

export function useLibraryItemSync(): LibraryItemSyncValue {
  const ctx = useContext(LibraryItemSyncContext);
  if (!ctx) {
    return {
      pageStatus: () => "synced",
      folderStatus: () => "synced",
    };
  }
  return ctx;
}
