"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { GreetingBlock } from "@/components/GreetingBlock";
import { LivelyLine } from "@/components/LivelyLine";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import { DashboardAskBar } from "@/components/dashboard/DashboardAskBar";
import { DashboardAddMaterial } from "@/components/dashboard/DashboardAddMaterial";
import { DashboardContinue } from "@/components/dashboard/DashboardContinue";
import { DashboardMetricsPills } from "@/components/dashboard/DashboardMetricsPills";
import { DashboardNextUp } from "@/components/dashboard/DashboardNextUp";
import { DashboardNotebooks } from "@/components/dashboard/DashboardNotebooks";
import { DashboardAchievements } from "@/components/dashboard/DashboardAchievements";
import { DashboardStarter } from "@/components/dashboard/DashboardStarter";
import { useAuth } from "@/hooks/useAuth";
import { listSubjects } from "@/lib/offline/library";
import { listTasks } from "@/lib/offline/tasks";
import { api } from "@/lib/api";
import { SHELF_CONTENT_CHANGED } from "@/lib/contentEvents";
import { pickNextUpTasks } from "@/lib/dashboardNextUp";
import { getReadingStats } from "@/lib/readingStats";
import {
  DASHBOARD_RECENT_NOTEBOOKS,
  peekDashboardHomeSession,
  pickRecentNotebooks,
  rememberDashboardHome,
  seedDashboardHome,
} from "@/lib/dashboardHomeSeed";
import {
  getLastRead,
  getRecentNotebookReads,
  getTabViewState,
  hydrateLastReads,
  LastRead,
} from "@/lib/tabViewState";
import { StudyTask, UserPageSummary, UserSubject } from "@/types";

async function resolveRecentNotebooks(
  listed: UserSubject[]
): Promise<UserSubject[]> {
  const bySlug = new Map(listed.map((s) => [s.slug, s]));
  const recent = getRecentNotebookReads();
  const missing = [
    ...new Set(
      recent
        .map((r) => r.notebookSlug)
        .filter(
          (slug): slug is string =>
            typeof slug === "string" && slug.length > 0 && !bySlug.has(slug)
        )
    ),
  ].slice(0, DASHBOARD_RECENT_NOTEBOOKS);

  const fetched = await Promise.all(
    missing.map((slug) =>
      api.myContent
        .getSubject(slug)
        .then((res) => res.subject)
        .catch(() => null)
    )
  );
  for (const nb of fetched) {
    if (nb) bySlug.set(nb.slug, nb);
  }

  return pickRecentNotebooks([...bySlug.values()]);
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [seed] = useState(() => seedDashboardHome());
  const [fromSession] = useState(() => Boolean(peekDashboardHomeSession()));
  const [listed, setListed] = useState<UserSubject[]>(seed.listed);
  const [rootPages, setRootPages] = useState<UserPageSummary[]>(seed.rootPages);
  const [notebookTotal, setNotebookTotal] = useState(seed.notebookTotal);
  const [recentNotebooks, setRecentNotebooks] = useState<UserSubject[]>(
    seed.recentNotebooks
  );
  const [lastRead, setLastRead] = useState<LastRead | null>(seed.lastRead);
  const [tasks, setTasks] = useState<StudyTask[]>(seed.tasks);
  /** First network home load finished (or session seed already painted it). */
  const [homeReady, setHomeReady] = useState(fromSession);
  const [reading, setReading] = useState(seed.reading);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadHome = useCallback(async () => {
    const [lastRes, libraryRes, taskRes] = await Promise.allSettled([
      api.myContent.getLastRead(),
      listSubjects({ pageSize: 8, sort: "recent" }),
      listTasks(),
    ]);

    if (lastRes.status === "fulfilled") {
      hydrateLastReads(lastRes.value);
    }
    const nextLastRead =
      getLastRead() ?? getRecentNotebookReads()[0] ?? null;
    setLastRead(nextLastRead);

    const nextTasks = taskRes.status === "fulfilled" ? taskRes.value : [];
    setTasks(nextTasks);

    let nextListed: UserSubject[] = [];
    let nextRootPages: UserPageSummary[] = [];
    let nextTotal = 0;
    let nextRecent: UserSubject[] = [];

    if (libraryRes.status === "fulfilled") {
      const res = libraryRes.value;
      nextListed = res.subjects;
      nextRootPages = res.rootPages ?? [];
      nextTotal = res.total;
      nextRecent = pickRecentNotebooks(res.subjects);
      setListed(nextListed);
      setRootPages(nextRootPages);
      setNotebookTotal(nextTotal);
      setRecentNotebooks(nextRecent);
      void resolveRecentNotebooks(res.subjects).then((resolved) => {
        setRecentNotebooks(resolved);
        rememberDashboardHome({
          listed: nextListed,
          rootPages: nextRootPages,
          notebookTotal: nextTotal,
          recentNotebooks: resolved,
          lastRead: nextLastRead,
          tasks: nextTasks,
        });
      });
    } else {
      setListed([]);
      setRootPages([]);
      setNotebookTotal(0);
      setRecentNotebooks([]);
    }

    rememberDashboardHome({
      listed: nextListed,
      rootPages: nextRootPages,
      notebookTotal: nextTotal,
      recentNotebooks: nextRecent,
      lastRead: nextLastRead,
      tasks: nextTasks,
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void loadHome().finally(() => {
      if (!cancelled) setHomeReady(true);
    });
    const onChange = () => {
      void loadHome();
    };
    window.addEventListener(SHELF_CONTENT_CHANGED, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(SHELF_CONTENT_CHANGED, onChange);
    };
  }, [user, loadHome]);

  useEffect(() => {
    const refresh = () => {
      const stats = getReadingStats();
      setReading({
        streak: stats.streak,
        todaySeconds: stats.todaySeconds,
        activeDates: stats.activeDates,
      });
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("shelf:reading-stats-changed", refresh);
    const id = window.setInterval(refresh, 60000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("shelf:reading-stats-changed", refresh);
      window.clearInterval(id);
    };
  }, [user?.id]);

  const nextUp = useMemo(() => pickNextUpTasks(tasks), [tasks]);
  const hasLibrary = notebookTotal > 0 || rootPages.length > 0;
  const emptySoFar = !hasLibrary && !lastRead && nextUp.total === 0;
  const isFirstTime = emptySoFar && homeReady;
  /** Seeded or confirmed content — metrics / add material stay visible. */
  const showReturning = !emptySoFar;

  // Network sections: skeleton only until first load when that slice has no seed.
  const continueLoading = !homeReady && !lastRead;
  const nextUpLoading = !homeReady && !fromSession;
  const notebooksLoading =
    !homeReady && recentNotebooks.length === 0 && !fromSession;

  const continueNotebookName = lastRead?.notebookSlug
    ? recentNotebooks.find((n) => n.slug === lastRead.notebookSlug)?.name ??
      listed.find((n) => n.slug === lastRead.notebookSlug)?.name ??
      null
    : null;
  const continuePdfPage = lastRead
    ? getTabViewState(lastRead.href)?.pdfPage
    : undefined;

  if (authLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center">
        <ThinkingIndicator label="Loading" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full max-w-[1080px] mx-auto w-full px-5 sm:px-8 py-5 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4 shrink-0">
            <div className="min-w-0">
              <GreetingBlock
                name={user.name}
                size="lg"
                align="left"
                showAccent={false}
                animatedDots
                showSubtitle={false}
              />
              <LivelyLine
                surface={isFirstTime ? "libraryEmpty" : "dashboard"}
                className="text-[13px] text-[var(--text-muted)] mt-1.5"
              />
            </div>
            {showReturning && (
              <DashboardMetricsPills
                readingSeconds={reading.todaySeconds}
                streak={reading.streak}
              />
            )}
          </div>

          <div className="mb-4 shrink-0">
            <DashboardAskBar />
            {showReturning && <DashboardAddMaterial />}
          </div>

          {isFirstTime ? (
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-5">
              <DashboardStarter />
              <DashboardNextUp items={[]} remaining={0} />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-5">
              <DashboardContinue
                loading={continueLoading}
                lastRead={lastRead}
                notebookName={continueNotebookName}
                pdfPage={continuePdfPage}
              />
              <DashboardNextUp
                loading={nextUpLoading}
                items={nextUp.items}
                remaining={nextUp.remaining}
              />
              <DashboardNotebooks
                loading={notebooksLoading}
                notebooks={recentNotebooks}
              />
              {showReturning && (
                <DashboardAchievements
                  streak={reading.streak}
                  activeDays={reading.activeDates.length}
                  hasLibrary={hasLibrary}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
