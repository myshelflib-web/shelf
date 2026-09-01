"use client";

import { ExploreResourceCard } from "@/components/learn/explore/ExploreResourceCard";
import type { CurrentAffairsItem } from "@/types";

export function CurrentAffairsItemCard({ item }: { item: CurrentAffairsItem }) {
  const href = item.sharePath ?? `/learn/current-affairs/${item.slug}`;
  const when = item.publishedAtShelf ?? item.publishedAt;
  const dateLabel = when
    ? new Date(when).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      })
    : null;

  const meta = [
    item.source.name,
    dateLabel,
    item.linkStatus === "BROKEN" ? "source unavailable" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ExploreResourceCard
      href={href}
      typeLabel="Current affairs"
      title={item.title}
      meta={meta}
      copy={
        item.shelfSummary ??
        "Shelf summary from an official source — open to read and cite."
      }
      openLabel="Read article"
    />
  );
}
