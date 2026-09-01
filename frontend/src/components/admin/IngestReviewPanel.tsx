"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { IngestItemRow, IngestSourceRow } from "@/types";
import { IngestReviewQueue } from "@/components/admin/IngestReviewQueue";
import { IngestSourcesSection } from "@/components/admin/IngestSourcesSection";

export function IngestReviewPanel() {
  const [sources, setSources] = useState<IngestSourceRow[]>([]);
  const [items, setItems] = useState<IngestItemRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pollBusyId, setPollBusyId] = useState<string | null>(null);
  const [seedBusy, setSeedBusy] = useState(false);
  const [sourcesRefreshBusy, setSourcesRefreshBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSources = useCallback(async () => {
    const { sources: next } = await api.admin.ingestSources();
    setSources(next);
  }, []);

  const loadItems = useCallback(async () => {
    const { items: next } = await api.admin.ingestItems({
      status: statusFilter,
      limit: 50,
    });
    setItems(next);
  }, [statusFilter]);

  useEffect(() => {
    let cancelled = false;
    setSourcesLoading(true);
    void loadSources()
      .catch(() => {
        if (!cancelled) setMessage("Failed to load sources");
      })
      .finally(() => {
        if (!cancelled) setSourcesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadSources]);

  useEffect(() => {
    let cancelled = false;
    setItemsLoading(true);
    void loadItems()
      .catch(() => {
        if (!cancelled) setMessage("Failed to load review queue");
      })
      .finally(() => {
        if (!cancelled) setItemsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadItems]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter]);

  const pendingItems = items.filter((item) => item.status === "PENDING_REVIEW");
  const allPendingSelected =
    pendingItems.length > 0 &&
    pendingItems.every((item) => selectedIds.has(item.id));

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPending() {
    if (allPendingSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(pendingItems.map((item) => item.id)));
  }

  async function runAction(
    id: string,
    action: () => Promise<unknown>,
    opts?: { reloadItems?: boolean; reloadSources?: boolean; success?: string }
  ) {
    setBusyId(id);
    setMessage(null);
    setSuccessMessage(null);
    try {
      await action();
      if (opts?.success) setSuccessMessage(opts.success);
      await Promise.all([
        opts?.reloadSources ? loadSources() : Promise.resolve(),
        opts?.reloadItems !== false ? loadItems() : Promise.resolve(),
      ]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function runPoll(sourceId: string) {
    setPollBusyId(sourceId);
    setMessage(null);
    setSuccessMessage(null);
    try {
      await api.admin.ingestPollSource(sourceId);
      setSuccessMessage("Poll queued.");
      await loadSources();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Poll failed");
    } finally {
      setPollBusyId(null);
    }
  }
  async function runSeed() {
    setSeedBusy(true);
    setMessage(null);
    setSuccessMessage(null);
    try {
      const result = await api.admin.ingestSeedSources();
      setSuccessMessage(
        `Sources updated (${result.created} new, ${result.updated} refreshed).`
      );
      await loadSources();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to seed sources");
    } finally {
      setSeedBusy(false);
    }
  }

  async function refreshSources() {
    setSourcesRefreshBusy(true);
    setMessage(null);
    try {
      await loadSources();
    } catch {
      setMessage("Failed to refresh sources");
    } finally {
      setSourcesRefreshBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Content ingestion</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Poll official sources, review summaries, and publish to Learn current affairs.
        </p>
      </div>

      {message ? (
        <p className="text-sm text-red-400 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2">
          {message}
        </p>
      ) : null}

      {successMessage ? (
        <p className="text-sm text-emerald-400 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
          {successMessage}
        </p>
      ) : null}

      <IngestSourcesSection
        sources={sources}
        loading={sourcesLoading}
        seedBusy={seedBusy}
        refreshBusy={sourcesRefreshBusy}
        pollBusyId={pollBusyId}
        onSeed={() => void runSeed()}
        onRefresh={() => void refreshSources()}
        onPoll={(sourceId) => void runPoll(sourceId)}
      />

      <IngestReviewQueue
        items={items}
        loading={itemsLoading}
        statusFilter={statusFilter}
        selectedIds={selectedIds}
        allPendingSelected={allPendingSelected}
        busyId={busyId}
        onStatusFilterChange={setStatusFilter}
        onToggleSelected={toggleSelected}
        onToggleSelectAllPending={toggleSelectAllPending}
        onApprove={(id) =>
          void runAction(id, () => api.admin.ingestApproveItem(id), {
            success: "Approved and queued for publish.",
          })
        }
        onReject={(id) =>
          void runAction(id, () => api.admin.ingestRejectItem(id), {
            success: "Item rejected.",
          })
        }
        onRetryPublish={(id) =>
          void runAction(
            `promote-${id}`,
            () => api.admin.ingestPromoteItem(id),
            { success: "Publish retry queued." }
          )
        }
        onBulkApproveSelected={() =>
          void runAction(
            "bulk-approve-selected",
            () =>
              api.admin.ingestBulkApproveItems({
                ids: [...selectedIds],
              }),
            { success: "Selected items approved." }
          )
        }
        onBulkApproveAll={() =>
          void runAction(
            "bulk-approve-all",
            () =>
              api.admin.ingestBulkApproveItems({
                status: "PENDING_REVIEW",
                limit: 50,
              }),
            { success: "Pending items approved." }
          )
        }
      />
    </div>
  );
}
