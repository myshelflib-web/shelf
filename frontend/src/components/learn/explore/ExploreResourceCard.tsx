"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLearnNavigation } from "@/components/learn/LearnNavigationProvider";

export function ExploreResourceCard({
  title,
  typeLabel,
  meta,
  copy,
  href,
  openLabel = "Open resource",
}: {
  title: string;
  typeLabel: string;
  meta: string;
  copy: string;
  href: string;
  openLabel?: string;
}) {
  const { startReaderOpen } = useLearnNavigation();
  const mark = title.trim().charAt(0).toUpperCase() || "•";

  return (
    <Link
      href={href}
      onClick={() => startReaderOpen(href)}
      className="explore-resource-card"
    >
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
        </div>
      </div>
      <p className="explore-resource-copy">{copy}</p>
      <span className="explore-resource-open">{openLabel}</span>
    </Link>
  );
}

export function ExploreResourceCardSkeleton() {
  return <div className="explore-resource-card explore-resource-card-skeleton" aria-hidden />;
}
