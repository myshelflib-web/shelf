"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  collectFailedEntityKeys,
  collectPendingEntityKeys,
  collectPendingPageIds,
  resolveFolderSyncVisual,
  resolveItemSyncVisual,
  type ItemSyncVisual,
} from "@/lib/offline/pendingPageSync";
import { ENTITY_SYNC_EVENT } from "@/lib/entitySyncState";
import {
  SYNC_STATUS_EVENT,
  syncStatusFromEvent,
} from "@/lib/syncStatus";

type LibraryItemSyncValue = {
  pageStatus: (pageId: string) => ItemSyncVisual;
  folderStatus: (pageIds: string[], folderKey?: string) => ItemSyncVisual;
};

const LibraryItemSyncContext = createContext<LibraryItemSyncValue | null>(
  null
);

const EMPTY = new Set<string>();

export function LibraryItemSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [pending, setPending] = useState<Set<string>>(EMPTY);
  const [failed, setFailed] = useState<Set<string>>(EMPTY);
  const [pendingEntities, setPendingEntities] = useState<Set<string>>(EMPTY);
  const [failedEntities, setFailedEntities] = useState<Set<string>>(EMPTY);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(() => {
    if (!user?.id) {
      setPending(EMPTY);
      setPendingEntities(EMPTY);
      setFailedEntities(EMPTY);
      return;
    }
    // Debounce — upload progress used to fire this on every xhr tick and
    // re-open IndexedDB, freezing the main thread.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void collectPendingPageIds(user.id).then(async (pages) => {
        const entities = await collectPendingEntityKeys(user.id, pages);
        setPending(pages);
        setPendingEntities(entities);
        setFailedEntities(collectFailedEntityKeys());
      });
    }, 400);
  }, [user?.id]);

  useEffect(() => {
    refresh();
    window.addEventListener(OFFLINE_SYNC_EVENT, refresh);
    window.addEventListener(OFFLINE_STATUS_EVENT, refresh);
    window.addEventListener(ENTITY_SYNC_EVENT, refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("shelf:tasks-changed", refresh);
    return () => {
      window.removeEventListener(OFFLINE_SYNC_EVENT, refresh);
      window.removeEventListener(OFFLINE_STATUS_EVENT, refresh);
      window.removeEventListener(ENTITY_SYNC_EVENT, refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("shelf:tasks-changed", refresh);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [refresh]);

  useEffect(() => {
    const onSync = (e: Event) => {
      const detail = syncStatusFromEvent(e);
      if (!detail) return;
      // Do NOT refresh on uploading/saving — that ran on every PUT progress
      // tick and made Upload click freeze the app after sync retries landed.
      if (detail.state === "synced" || detail.state === "idle") {
        setFailed(EMPTY);
        refresh();
      }
      if (detail.state === "error") {
        setPending((prev) => {
          setFailed(new Set(prev));
          return prev;
        });
        setFailedEntities(collectFailedEntityKeys());
        refresh();
      }
    };
    const onActionError = () => {
      setPending((prev) => {
        setFailed(new Set(prev));
        return prev;
      });
      setFailedEntities(collectFailedEntityKeys());
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
      pageStatus: (pageId) =>
        resolveItemSyncVisual(
          pageId,
          pending,
          failed,
          pendingEntities,
          failedEntities
        ),
      folderStatus: (pageIds, folderKey) =>
        resolveFolderSyncVisual(
          pageIds,
          pending,
          failed,
          folderKey,
          pendingEntities,
          failedEntities
        ),
    }),
    [pending, failed, pendingEntities, failedEntities]
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
