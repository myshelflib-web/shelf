"use client";

import { usePathname } from "next/navigation";
import {
  ReaderWorkspace,
  PersonalPageReaderScope,
} from "@/components/my-content/reader/ReaderWorkspace";
import {
  mergeReaderScope,
  scopeFromHref,
  scopeHref,
} from "@/components/my-content/reader/types";
import { useAuth } from "@/hooks/useAuth";
import { SharedLinkSignInGate } from "@/components/my-content/SharedLinkSignInGate";
import { ThinkingIndicator } from "@/components/GreetingAccent";

export type { PersonalPageReaderScope };

/**
 * Prefer scope from the current pathname so soft tab URL updates
 * (history.replaceState) stay correct even when the App Router page
 * segment that first mounted doesn't match the new path shape.
 */
export function PersonalPageReader({
  scope: routeScope,
}: {
  scope: PersonalPageReaderScope;
}) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const href =
    pathname && typeof window !== "undefined"
      ? `${pathname}${window.location.search}`
      : pathname;
  const fromPath = href ? scopeFromHref(href) : null;
  const scope = mergeReaderScope(fromPath, routeScope);

  if (scope.kind === "shared") {
    if (authLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <ThinkingIndicator label="Loading" />
        </div>
      );
    }
    if (!user) {
      return <SharedLinkSignInGate returnTo={scopeHref(scope)} />;
    }
  }

  return <ReaderWorkspace scope={scope} />;
}
