"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { needsOnboarding } from "@/lib/onboarding";

/** Sends new accounts to /onboarding before the library shell loads. */
export function OnboardingRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (!needsOnboarding(user)) return;
    const next = `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`;
    router.replace(`/onboarding?next=${encodeURIComponent(next)}`);
  }, [user, loading, router, pathname]);

  return null;
}
