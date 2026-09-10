"use client";

import type { ReactNode } from "react";
import { Zap } from "lucide-react";
import clsx from "clsx";
import type { ItemSyncVisual } from "@/lib/offline/pendingPageSync";

/** Corner lightning badge — sync mark on explorer folder/file icons. */
export function ItemSyncBadge({
  status,
  className = "",
}: {
  status: ItemSyncVisual;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-[11px] w-[11px] items-center justify-center rounded-full border bg-[var(--bg-elevated)] shadow-sm",
        status === "synced" && "border-emerald-600/70 text-emerald-500",
        status === "pending" && "border-amber-500/70 text-amber-400",
        status === "error" && "border-red-500/70 text-red-400",
        className
      )}
      title={
        status === "synced"
          ? "Synced"
          : status === "pending"
            ? "Waiting to sync"
            : "Sync failed"
      }
      aria-hidden
    >
      <Zap
        className={clsx(
          "h-[7px] w-[7px]",
          status === "pending" && "animate-pulse"
        )}
        fill="currentColor"
        strokeWidth={0}
      />
    </span>
  );
}

export function WithItemSyncBadge({
  status,
  children,
}: {
  status: ItemSyncVisual;
  children: ReactNode;
}) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      {children}
      <ItemSyncBadge status={status} />
    </span>
  );
}
