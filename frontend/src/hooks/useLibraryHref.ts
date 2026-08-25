"use client";

import { useEffect, useState } from "react";
import {
  WORKSPACE_CHANGED_EVENT,
  getLibraryHref,
} from "@/components/my-content/reader/types";
import { usePathname } from "next/navigation";

/** Live Library destination — focused reader tab when open, else `/my-content`. */
export function useLibraryHref(): string {
  const pathname = usePathname();
  const [href, setHref] = useState("/my-content");

  useEffect(() => {
    const sync = () => setHref(getLibraryHref());
    sync();
    window.addEventListener(WORKSPACE_CHANGED_EVENT, sync);
    return () => window.removeEventListener(WORKSPACE_CHANGED_EVENT, sync);
  }, [pathname]);

  return href;
}

/** Skip nav when the address bar already matches (avoids remounting the reader). */
export function shouldSkipLibraryNav(href: string): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname === href;
}
