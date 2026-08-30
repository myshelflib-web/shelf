"use client";

import Link from "next/link";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import {
  PRODUCT_INTENT_CLUSTERS,
  type IntentCluster,
} from "@/lib/seo/intentCoverage";

/** Crawlable map of product intents — exam curriculum stays on /learn. */
export function IntentCoverageSection({
  title = "Shelf helps with all of this",
  subtitle = "Every major study and teaching workflow Shelf supports — linked to the best page for that search.",
  clusters = PRODUCT_INTENT_CLUSTERS,
}: {
  title?: string;
  subtitle?: string;
  clusters?: IntentCluster[];
}) {
  return (
    <section
      className="px-4 sm:px-6 pb-20 max-w-4xl mx-auto"
      aria-labelledby="intent-coverage-heading"
    >
      <RevealOnScroll>
        <h2
          id="intent-coverage-heading"
          className="text-xl sm:text-2xl font-semibold mb-2"
        >
          {title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </RevealOnScroll>
      <ul className="grid gap-3 sm:grid-cols-2">
        {clusters.map((cluster, i) => (
          <li key={cluster.id} className="list-none">
            <RevealOnScroll delay={Math.min(i * 20, 200)}>
              <Link
                href={cluster.path}
                className="block h-full p-4 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] transition"
              >
                <span className="font-semibold text-sm text-[var(--text-primary)]">
                  {cluster.label}
                </span>
                <span className="mt-1.5 block text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">
                  {cluster.queries.slice(0, 3).join(" · ")}
                </span>
              </Link>
            </RevealOnScroll>
          </li>
        ))}
      </ul>
    </section>
  );
}
