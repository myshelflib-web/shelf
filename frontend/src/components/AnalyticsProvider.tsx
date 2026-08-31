"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";
import {
  AnalyticsEvents,
  identifyFromUser,
  initAnalytics,
  installClientErrorMonitoring,
  pageview,
  resetAnalytics,
  track,
} from "@/lib/analytics";

function AnalyticsPageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    pageview(url);
  }, [pathname, searchParams]);

  return null;
}

function AnalyticsIdentity() {
  const { user } = useAuth();
  const telegramLinkedRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    if (!user) {
      telegramLinkedRef.current = undefined;
      resetAnalytics();
      return;
    }
    identifyFromUser(user);

    const wasLinked = telegramLinkedRef.current;
    const isLinked = Boolean(user.telegramLinked);
    if (wasLinked === false && isLinked) {
      track(AnalyticsEvents.telegramLinked, { surface: "account" });
    }
    telegramLinkedRef.current = isLinked;
  }, [user]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
    return installClientErrorMonitoring();
  }, []);

  return (
    <ClientErrorBoundary>
      <Suspense fallback={null}>
        <AnalyticsPageviews />
      </Suspense>
      <AnalyticsIdentity />
      {children}
    </ClientErrorBoundary>
  );
}
