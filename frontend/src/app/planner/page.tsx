"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { LivelyLine } from "@/components/LivelyLine";
import { StudyCalendar } from "@/components/StudyCalendar";
import {
  PlannerHeaderMenu,
  type PlannerHeaderActions,
} from "@/components/PlannerHeaderMenu";
import { useAuth } from "@/hooks/useAuth";
import { getStoredUser } from "@/lib/api";
import { listSubjects, peekCachedLibrary } from "@/lib/offline/library";
import { UserSubject } from "@/types";
import { ThinkingIndicator, GreetingDots } from "@/components/GreetingAccent";

function PlannerShell({
  children,
  menu,
}: {
  children: React.ReactNode;
  menu?: React.ReactNode;
}) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 px-5 sm:px-6 py-5 max-w-[90rem] mx-auto w-full flex flex-col">
        <div className="shrink-0 mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="page-title">
              Planner
              <GreetingDots className="text-[var(--text-muted)]" />
            </h1>
            <LivelyLine surface="planner" className="page-subtitle mt-1" />
          </div>
          {menu}
        </div>
        <div className="flex-1 min-h-0">{children}</div>
      </main>
    </div>
  );
}

function PlannerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const storedUser = typeof window !== "undefined" ? getStoredUser() : null;
  const sessionUser = user ?? storedUser;
  const [library, setLibrary] = useState<UserSubject[]>(
    () => peekCachedLibrary()?.subjects ?? []
  );
  const actionsRef = useRef<PlannerHeaderActions | null>(null);
  const dateParam = searchParams.get("date");
  const initialCursor = dateParam
    ? new Date(`${dateParam}T12:00:00`)
    : new Date();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!sessionUser) return;
    listSubjects()
      .then(({ subjects }) => setLibrary(subjects))
      .catch(() => {});
  }, [sessionUser]);

  const run = (key: keyof PlannerHeaderActions) => {
    actionsRef.current?.[key]();
  };

  // No stored session yet — wait for auth (login redirect or first paint).
  if (!sessionUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <ThinkingIndicator label="Loading" />
      </div>
    );
  }

  return (
    <PlannerShell
      menu={
        <PlannerHeaderMenu
          onNewTask={() => run("onNewTask")}
          onNewEvent={() => run("onNewEvent")}
          onToday={() => run("onToday")}
          onWeek={() => run("onWeek")}
          onMonth={() => run("onMonth")}
        />
      }
    >
      <StudyCalendar
        library={library}
        initialView="week"
        initialCursor={initialCursor}
        initialEditTaskId={searchParams.get("edit")}
        actionsRef={actionsRef}
      />
    </PlannerShell>
  );
}

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <PlannerShell>
          <div className="h-full min-h-0 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)]" />
        </PlannerShell>
      }
    >
      <PlannerInner />
    </Suspense>
  );
}
