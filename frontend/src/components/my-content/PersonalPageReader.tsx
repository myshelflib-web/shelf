"use client";

import { usePathname } from "next/navigation";
import {
  ReaderWorkspace,
  PersonalPageReaderScope,
} from "@/components/my-content/reader/ReaderWorkspace";
import { scopeFromHref } from "@/components/my-content/reader/types";

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
  const fromPath = pathname ? scopeFromHref(pathname) : null;
  const scope = fromPath ?? routeScope;
  return <ReaderWorkspace scope={scope} />;
}
