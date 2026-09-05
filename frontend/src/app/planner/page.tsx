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
import { listSubjects } from "@/lib/offline/library";
import { UserSubject } from "@/types";
import { ThinkingIndicator } from "@/components/GreetingAccent";

function PlannerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<UserSubject[]>([]);
  const actionsRef = useRef<PlannerHeaderActions | null>(null);
  const dateParam = searchParams.get("date");
  const initialCursor = dateParam
    ? new Date(`${dateParam}T12:00:00`)
    : new Date();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    listSubjects()
      .then(({ subjects }) => setLibrary(subjects))
      .catch(() => {});
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center">
        <ThinkingIndicator label="Loading" />
      </div>
    );
  }

  const run = (key: keyof PlannerHeaderActions) => {
    actionsRef.current?.[key]();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 px-5 sm:px-6 py-5 max-w-[90rem] mx-auto w-full flex flex-col">
        <div className="shrink-0 mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="page-title">Planner</h1>
            <LivelyLine surface="planner" className="page-subtitle mt-1" />
          </div>
          <PlannerHeaderMenu
            onNewTask={() => run("onNewTask")}
            onNewEvent={() => run("onNewEvent")}
            onToday={() => run("onToday")}
            onWeek={() => run("onWeek")}
            onMonth={() => run("onMonth")}
          />
        </div>
        <div className="flex-1 min-h-0">
          <StudyCalendar
            library={library}
            initialView="week"
            initialCursor={initialCursor}
            initialEditTaskId={searchParams.get("edit")}
            actionsRef={actionsRef}
          />
        </div>
      </main>
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <ThinkingIndicator label="Loading" />
        </div>
      }
    >
      <PlannerInner />
    </Suspense>
  );
}
