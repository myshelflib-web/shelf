import type { ContentGenStatus } from "@/types";

export const CONTENT_GEN_STATUS_STYLES: Record<ContentGenStatus, string> = {
  QUEUED: "bg-gray-500/10 text-gray-400",
  RUNNING: "bg-yellow-500/10 text-yellow-500",
  PAUSED: "bg-sky-500/10 text-sky-400",
  COMPLETED: "bg-green-500/10 text-green-500",
  FAILED: "bg-red-500/10 text-red-500",
  SKIPPED: "bg-orange-500/10 text-orange-400",
};

export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
