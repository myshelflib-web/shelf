"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { useOptionalPreloadedOpenFiles } from "@/components/learn/PreloadedOpenFilesContext";
import {
  PreloadedBrowsePath,
  browseHref,
  browsePathFromHref,
  isSameBrowseFolder,
} from "@/lib/preloadedBrowse";

/** Folder and article hrefs stay on Library when the browse context is mounted. */
export function useOpenBrowseHref() {
  const browse = useOptionalPreloadedBrowse();
  const openFiles = useOptionalPreloadedOpenFiles();
  const router = useRouter();

  return (href: string, title?: string, pageId?: string) => {
    const path = browsePathFromHref(href);
    if (browse?.interceptFolderNav) {
      if (path.articleSlug) {
        openFiles?.openFromHref(href, title, pageId);
        return;
      }
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
  preventNav = false,
  onOpen,
  expanded,
  collapseTo,
  title,
}: {
  path: PreloadedBrowsePath;
  href?: string;
  className?: string;
  children: React.ReactNode;
  /** Stay on this page — used by the reader so folders only expand. */
  preventNav?: boolean;
  onOpen?: () => void;
  expanded?: boolean;
  /** Clicking an already-open folder collapses to this parent path. */
  collapseTo?: PreloadedBrowsePath;
  /** Tab title when this link opens a preloaded article. */
  title?: string;
}) {
  const browse = useOptionalPreloadedBrowse();
  const openFiles = useOptionalPreloadedOpenFiles();
  const resolvedHref = href ?? browseHref(path);

  if (browse?.interceptFolderNav) {
    return (
      <button
        type="button"
        className={className}
        aria-expanded={expanded}
        onClick={() => {
          if (path.articleSlug) {
            onOpen?.();
            openFiles?.openFromHref(resolvedHref, title);
            return;
          }
          if (
            collapseTo !== undefined &&
            isSameBrowseFolder(browse.path, path)
          ) {
            browse.setPath(collapseTo);
            return;
          }
          browse.setPath(path);
        }}
      >
        {children}
      </button>
    );
  }

  if (preventNav || onOpen) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => onOpen?.()}
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
