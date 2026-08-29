"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import {
  OnboardingWizard,
  safeNextPath,
} from "@/components/onboarding/OnboardingWizard";
import { useAuth } from "@/hooks/useAuth";
import { needsOnboarding } from "@/lib/onboarding";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/onboarding")}`);
      return;
    }
    if (!needsOnboarding(user)) {
      router.replace(nextPath);
    }
  }, [user, loading, router, nextPath]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <ThinkingIndicator label="Loading" />
      </div>
    );
  }

  if (!needsOnboarding(user)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <ThinkingIndicator label="Opening library" />
      </div>
    );
  }

  return <OnboardingWizard nextPath={nextPath} />;
}

export default function OnboardingPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden onboarding-page">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <ThinkingIndicator label="Loading" />
            </div>
          }
        >
          <OnboardingContent />
        </Suspense>
      </main>
    </div>
  );
}
