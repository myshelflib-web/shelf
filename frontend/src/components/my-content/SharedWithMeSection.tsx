"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { api } from "@/lib/api";
import { clsx } from "clsx";
import type { PersonalPageReaderScope } from "@/components/my-content/reader/types";

export type SharedWithMeItem = {
  shareId: string;
  pageId: string;
  title: string;
  contentType: string;
  role: "view" | "edit";
  status: "active" | "removed";
  href: string;
  owner: { id: string; name: string; email: string; avatarUrl: string | null };
  unread: boolean;
  copiedPageId: string | null;
  updatedAt: string;
};

type Props = {
  activePageId?: string | null;
  onOpenPage?: (tab: {
    href: string;
    title: string;
    pageId: string;
    scope: PersonalPageReaderScope;
  }) => void;
  workspaceMode?: boolean;
};

export function SharedWithMeSection({
  activePageId,
  onOpenPage,
  workspaceMode,
}: Props) {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<SharedWithMeItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [menuId, setMenuId] = useState<string | null>(null);

  const reload = useCallback(() => {
    void api.myContent
      .listSharedWithMe()
      .then((r) => {
        setItems(r.items);
        setUnread(r.unread);
      })
      .catch(() => {
        setItems([]);
        setUnread(0);
      });
  }, []);

  useEffect(() => {
    reload();
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);
    window.addEventListener("shelf:shares-changed", reload);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("shelf:shares-changed", reload);
    };
  }, [reload]);

  if (items.length === 0) return null;

  const openShared = (item: SharedWithMeItem) => {
    if (item.status === "removed") return;
    const scope: PersonalPageReaderScope = {
      kind: "shared",
      pageId: item.pageId,
    };
    if (workspaceMode && onOpenPage) {
      onOpenPage({
        href: item.href,
        title: item.title,
        pageId: item.pageId,
        scope,
      });
      return;
    }
    window.location.href = item.href;
  };

  const hide = async (shareId: string) => {
    setMenuId(null);
    try {
      await api.myContent.hideSharedItem(shareId);
      reload();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-0.5 mt-3 pt-2 border-t border-[var(--border)]">
      <button
        type="button"
        className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-[var(--bg-elevated)] text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[var(--text-muted)] shrink-0">
          {open ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
        <span className="flex-1 text-[13px] font-semibold text-[var(--text-primary)]">
          Shared with me
        </span>
        {unread > 0 && (
          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
            {unread} new
          </span>
        )}
      </button>

      {open &&
        items.map((item) => {
          const active = activePageId === item.pageId;
          const removed = item.status === "removed";
          return (
            <div
              key={item.shareId}
              className={clsx(
                "group relative flex items-start gap-1.5 rounded-md px-1.5 py-1.5 ml-3",
                removed
                  ? "opacity-55"
                  : active
                    ? "bg-[var(--bg-elevated)]"
                    : "hover:bg-[var(--bg-elevated)] cursor-pointer"
              )}
              role={removed ? undefined : "button"}
              tabIndex={removed ? undefined : 0}
              onClick={() => openShared(item)}
              onKeyDown={(e) => {
                if (removed) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openShared(item);
                }
              }}
            >
              <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--text-muted)]" />
              <div className="min-w-0 flex-1">
                <p
                  className={clsx(
                    "text-[12px] font-semibold truncate",
                    active
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)]"
                  )}
                >
                  {item.title}
                  {item.unread && !removed && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)] ml-1.5 align-middle" />
                  )}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="truncate">{item.owner.name}</span>
                  <span>·</span>
                  <span
                    className={clsx(
                      "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full",
                      removed
                        ? "bg-red-500/15 text-red-400"
                        : item.role === "edit"
                          ? "bg-[var(--accent-light)] text-[var(--accent)]"
                          : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    )}
                  >
                    {removed
                      ? "Access removed"
                      : item.role === "edit"
                        ? "Can edit"
                        : "Can view"}
                  </span>
                </p>
              </div>
              {item.copiedPageId && !removed && (
                <span
                  className="text-[10px] text-[var(--text-muted)] pt-1"
                  title="Already copied to My Library"
                >
                  ✓
                </span>
              )}
              <div
                className="relative shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="p-0.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
                  aria-label="Shared item options"
                  onClick={() =>
                    setMenuId((id) => (id === item.shareId ? null : item.shareId))
                  }
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
                {menuId === item.shareId && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl p-1">
                    {!removed && (
                      <button
                        type="button"
                        className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                        onClick={() => {
                          setMenuId(null);
                          openShared(item);
                        }}
                      >
                        Open
                      </button>
                    )}
                    <button
                      type="button"
                      className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                      onClick={() => void hide(item.shareId)}
                    >
                      {removed ? "Remove from list" : "Hide from Shared with me"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
