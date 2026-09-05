"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLearnNavigation } from "@/components/learn/LearnNavigationProvider";
import { useOpenBrowseHref } from "@/components/learn/BrowseFolderLink";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { formatArticleUpdatedAt } from "@/lib/exploreCatalog";

export function ExploreResourceCard({
  title,
  typeLabel,
  meta,
  copy,
  href,
  openLabel = "Open resource",
  updatedAt,
}: {
  title: string;
  typeLabel: string;
  meta: string;
  copy: string;
  href: string;
  openLabel?: string;
  updatedAt?: string | null;
}) {
  const { startReaderOpen } = useLearnNavigation();
  const browse = useOptionalPreloadedBrowse();
  const openBrowseHref = useOpenBrowseHref();
  const mark = title.trim().charAt(0).toUpperCase() || "•";
  const updatedLabel = formatArticleUpdatedAt(updatedAt);
  const body = (
    <>
      <div className="explore-resource-card-top">
        <span className="explore-resource-mark" aria-hidden>
          {mark}
        </span>
        <div className="explore-resource-card-body">
          <div className="explore-resource-card-head">
            <span className="explore-resource-type">{typeLabel}</span>
            <ArrowUpRight className="explore-resource-card-arrow" aria-hidden />
          </div>
          <h3 className="explore-resource-title">{title}</h3>
          <p className="explore-resource-meta">{meta}</p>
          {updatedLabel ? (
            <p className="explore-resource-date">
              Updated{" "}
              <time dateTime={updatedAt ?? undefined}>{updatedLabel}</time>
            </p>
          ) : null}
        </div>
      </div>
      <p className="explore-resource-copy">{copy}</p>
      <span className="explore-resource-open">{openLabel}</span>
    </>
  );

  if (browse?.interceptFolderNav) {
    return (
      <button
        type="button"
        className="explore-resource-card"
        onClick={() => openBrowseHref(href, title)}
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      href={href}
      onClick={() => startReaderOpen(href)}
      className="explore-resource-card"
    >
      {body}
    </Link>
  );
}

export function ExploreResourceCardSkeleton() {
  return <div className="explore-resource-card explore-resource-card-skeleton" aria-hidden />;
}
