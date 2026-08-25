"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { LivelyLine } from "@/components/LivelyLine";
import { StudyCalendar } from "@/components/StudyCalendar";
import { useAuth } from "@/hooks/useAuth";
import { listSubjects } from "@/lib/offline/library";
import { UserSubject } from "@/types";
import { ThinkingIndicator } from "@/components/GreetingAccent";

function PlannerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [library, setLibrary] = useState<UserSubject[]>([]);
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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 px-5 sm:px-6 py-5 max-w-[90rem] mx-auto w-full flex flex-col">
        <div className="shrink-0 mb-4">
          <h1 className="page-title">Planner</h1>
          <LivelyLine surface="planner" className="page-subtitle mt-1" />
        </div>
        <div className="flex-1 min-h-0">
          <StudyCalendar
            library={library}
            initialView="week"
            initialCursor={initialCursor}
            initialEditTaskId={searchParams.get("edit")}
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
