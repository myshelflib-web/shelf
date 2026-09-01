"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import type {
  ContentGenItemRow,
  ContentGenJobRow,
  ContentGenNewsCluster,
  ContentGenOverview,
  StudyGoal,
} from "@/types";
import { ContentGenJobsSection } from "./ContentGenJobsSection";
import { NewsGenSection, type NewsRunOptions } from "./NewsGenSection";
import {
  StarterPackSection,
  type StarterPackRunOptions,
} from "./StarterPackSection";
import { ProviderSummary } from "./ProviderSummary";

const POLL_MS = 4000;
const ITEM_PAGE = 40;

export function ContentGenPanel() {
  const [overview, setOverview] = useState<ContentGenOverview | null>(null);
  const [jobs, setJobs] = useState<ContentGenJobRow[]>([]);
  const [items, setItems] = useState<ContentGenItemRow[]>([]);
  const [itemsCursor, setItemsCursor] = useState<string | null>(null);
  const [itemsHasMore, setItemsHasMore] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [pagedBeyondFirst, setPagedBeyondFirst] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [clusters, setClusters] = useState<ContentGenNewsCluster[] | null>(null);

  const [overviewLoading, setOverviewLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [busyGoal, setBusyGoal] = useState<StudyGoal | null>(null);
  const [planning, setPlanning] = useState(false);
  const [newsRunning, setNewsRunning] = useState(false);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setOverview(await api.admin.contentGenOverview());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load overview");
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      const { jobs: next } = await api.admin.contentGenJobs();
      setJobs(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load runs");
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const loadItems = useCallback(async (
    jobId: string,
    mode: "reset" | "more",
    cursor?: string | null
  ) => {
    setItemsLoading(true);
    try {
      const page = await api.admin.contentGenJobItems(jobId, {
        cursor: mode === "more" ? cursor ?? undefined : undefined,
        limit: ITEM_PAGE,
      });
      setItems((prev) => (mode === "more" ? [...prev, ...page.items] : page.items));
      setItemsCursor(page.nextCursor);
      setItemsHasMore(page.hasMore);
      if (mode === "more") setPagedBeyondFirst(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pages");
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
    void loadJobs();
  }, [loadOverview, loadJobs]);

  const hasActiveJob = jobs.some(
    (job) => job.status === "QUEUED" || job.status === "RUNNING"
  );
  const activeJob = jobs.find(
    (job) => job.status === "QUEUED" || job.status === "RUNNING"
  );
  const lockReason = activeJob
    ? `A ${activeJob.kind === "NEWS_BRIEF" ? "news" : "syllabus"} run for ${activeJob.studyGoal} is ${activeJob.status.toLowerCase()}. Only one job at a time — wait for it to finish, or check Runs below.`
    : null;
  const shouldPoll =
    hasActiveJob || jobs.some((job) => job.status === "PAUSED");

  useEffect(() => {
    if (!shouldPoll) return;
    const interval = setInterval(() => {
      void loadJobs();
      if (expandedId && !pagedBeyondFirst) void loadItems(expandedId, "reset");
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [shouldPoll, expandedId, pagedBeyondFirst, loadJobs, loadItems]);

  function toggleJob(jobId: string) {
    if (expandedId === jobId) {
      setExpandedId(null);
      setItems([]);
      setItemsCursor(null);
      setItemsHasMore(false);
      setPagedBeyondFirst(false);
      return;
    }
    setExpandedId(jobId);
    setItems([]);
    setItemsCursor(null);
    setItemsHasMore(false);
    setPagedBeyondFirst(false);
    void loadItems(jobId, "reset");
  }

  async function refreshRuns() {
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    setPagedBeyondFirst(false);
    try {
      await Promise.all([
        loadOverview(),
        loadJobs(),
        expandedId ? loadItems(expandedId, "reset") : Promise.resolve(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  async function runStarterPack(opts: StarterPackRunOptions) {
    setBusyGoal(opts.studyGoal);
    setError(null);
    setNotice(null);
    try {
      const { jobId, plannedCount } = await api.admin.contentGenStarterPack(opts);
      setNotice(
        `Started ${plannedCount} page${plannedCount === 1 ? "" : "s"} for ${opts.studyGoal}${
          opts.subjectSlug ? ` / ${opts.subjectSlug}` : ""
        }${opts.dryRun ? " (dry run — nothing will be published)" : ""}.`
      );
      setExpandedId(jobId);
      setPagedBeyondFirst(false);
      await loadJobs();
      await loadItems(jobId, "reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start generation");
    } finally {
      setBusyGoal(null);
    }
  }

  async function resumeJob(jobId: string) {
    setResumingId(jobId);
    setError(null);
    try {
      await api.admin.contentGenResume(jobId);
      setNotice("Resuming — remaining pages will continue from where they stopped.");
      await loadJobs();
      if (expandedId === jobId && !pagedBeyondFirst) await loadItems(jobId, "reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resume this run");
    } finally {
      setResumingId(null);
    }
  }

  async function stopJob(jobId: string) {
    setStoppingId(jobId);
    setError(null);
    try {
      await api.admin.contentGenStop(jobId);
      setNotice(
        "Stopping — in-flight pages will be skipped. Published pages stay."
      );
      await loadJobs();
      if (expandedId === jobId && !pagedBeyondFirst) await loadItems(jobId, "reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stop this run");
    } finally {
      setStoppingId(null);
    }
  }

  async function retryFailed(jobId: string) {
    setRetryingId(jobId);
    setError(null);
    setNotice(null);
    try {
      const { jobId: nextId, plannedCount } = await api.admin.contentGenRetryFailed(
        jobId
      );
      setNotice(
        `Retrying ${plannedCount} failed page${plannedCount === 1 ? "" : "s"} as a new run.`
      );
      setExpandedId(nextId);
      setPagedBeyondFirst(false);
      await loadJobs();
      await loadItems(nextId, "reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not retry failed pages");
    } finally {
      setRetryingId(null);
    }
  }

  async function planNews(opts: NewsRunOptions) {
    setPlanning(true);
    setError(null);
    try {
      const res = await api.admin.contentGenNewsPlan(opts);
      setClusters(res.clusters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not preview stories");
    } finally {
      setPlanning(false);
    }
  }

  async function runNews(opts: NewsRunOptions) {
    setNewsRunning(true);
    setError(null);
    setNotice(null);
    try {
      const { jobId, plannedCount } = await api.admin.contentGenNews(opts);
      setNotice(
        `Started ${plannedCount} brief${plannedCount === 1 ? "" : "s"} for ${opts.studyGoal}${
          opts.dryRun ? " (dry run — nothing will be published)" : ""
        }.`
      );
      setExpandedId(jobId);
      setPagedBeyondFirst(false);
      await loadJobs();
      await loadItems(jobId, "reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start generation");
    } finally {
      setNewsRunning(false);
    }
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Content generation</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Generate syllabus-mapped starter packs and original current-affairs
          briefs, and watch every run as it happens.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {notice}
        </div>
      )}

      <ProviderSummary overview={overview} loading={overviewLoading} />

      <StarterPackSection
        packs={overview?.packs ?? []}
        loading={overviewLoading}
        busyGoal={busyGoal}
        disabled={hasActiveJob}
        lockReason={lockReason}
        onRun={runStarterPack}
      />

      <NewsGenSection
        clusters={clusters}
        planning={planning}
        running={newsRunning}
        disabled={hasActiveJob}
        lockReason={lockReason}
        onPlan={planNews}
        onRun={runNews}
      />

      <ContentGenJobsSection
        jobs={jobs}
        items={items}
        itemsLoading={itemsLoading}
        itemsHasMore={itemsHasMore}
        loading={refreshing || jobsLoading}
        expandedId={expandedId}
        resumingId={resumingId}
        retryingId={retryingId}
        stoppingId={stoppingId}
        retryDisabled={hasActiveJob}
        onToggle={toggleJob}
        onLoadMore={() => {
          if (expandedId) void loadItems(expandedId, "more", itemsCursor);
        }}
        onRefresh={() => void refreshRuns()}
        onResume={(jobId) => void resumeJob(jobId)}
        onRetryFailed={(jobId) => void retryFailed(jobId)}
        onStop={(jobId) => void stopJob(jobId)}
      />
    </div>
  );
}
