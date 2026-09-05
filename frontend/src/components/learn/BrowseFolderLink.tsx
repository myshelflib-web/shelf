"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { isLearnReaderHref } from "@/lib/learnContent";
import {
  PreloadedBrowsePath,
  browseHref,
  browsePathFromHref,
} from "@/lib/preloadedBrowse";

/** Folder hrefs stay in the explorer; article hrefs still open the reader. */
export function useOpenBrowseHref() {
  const browse = useOptionalPreloadedBrowse();
  const router = useRouter();

  return (href: string) => {
    if (isLearnReaderHref(href)) {
      router.push(href);
      return;
    }
    const path = browsePathFromHref(href);
    if (browse?.interceptFolderNav) {
      browse.setPath(path);
      return;
    }
    router.push(href);
  };
}

/** Folder navigation: stay on Library home when the browse context is mounted. */
export function BrowseFolderLink({
  path,
  href,
  className,
  children,
}: {
  path: PreloadedBrowsePath;
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const browse = useOptionalPreloadedBrowse();
  const resolvedHref = href ?? browseHref(path);

  if (browse?.interceptFolderNav) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => browse.setPath(path)}
      >
        {children}
      </button>
    );
  }

  return (
    <Link href={resolvedHref} className={className}>
      {children}
    </Link>
  );
}
