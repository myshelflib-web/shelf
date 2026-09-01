"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Copy,
  ExternalLink,
  Share2,
} from "lucide-react";
import type { CurrentAffairsPublicItem } from "@/lib/seo/currentAffairsFetch";
import { getSiteUrl } from "@/lib/siteUrl";
import { CurrentAffairsWorkspace } from "@/components/learn/CurrentAffairsWorkspace";
import { EmbedViewer } from "@/components/my-content/EmbedViewer";

function formatWhen(item: CurrentAffairsPublicItem): string {
  const raw = item.publishedAtShelf ?? item.publishedAt;
  if (!raw) return "";
  return new Date(raw).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function CurrentAffairsItemView({
  item,
}: {
  item: CurrentAffairsPublicItem;
}) {
  const [copied, setCopied] = useState<"link" | "cite" | null>(null);
  const shareUrl = useMemo(
    () => `${getSiteUrl()}${item.sharePath}`,
    [item.sharePath]
  );
  const returnTo = item.sharePath;

  const citation = useMemo(() => {
    const when = formatWhen(item);
    const parts = [
      `"${item.title}"`,
      item.source.name,
      when ? `(${when})` : null,
      item.shelfSummary ? `— ${item.shelfSummary}` : null,
      `Shelf: ${shareUrl}`,
      `Source: ${item.canonicalUrl}`,
    ].filter(Boolean);
    return parts.join(". ");
  }, [item, shareUrl]);

  const showEmbed =
    item.embeddable !== false &&
    item.linkStatus !== "BROKEN" &&
    !/\.pdf($|\?)/i.test(item.canonicalUrl);

  const copyText = useCallback(async (text: string, kind: "link" | "cite") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <CurrentAffairsWorkspace currentHref={returnTo}>
      <div className="explore-workspace relative h-full flex flex-col overflow-hidden">
        <div className="explore-workspace-scroll flex-1 min-h-0">
          <div className="explore-page-inner explore-page-body pb-10">
            <header className="explore-scoped-head !items-start mb-4">
              <div className="min-w-0 flex-1">
                <nav className="explore-breadcrumb" aria-label="Breadcrumb">
                  <Link href="/learn" className="hover:text-[var(--accent)]">
                    Explore
                  </Link>
                  <ChevronRight className="w-3 h-3" aria-hidden />
                  <Link
                    href="/learn/current-affairs"
                    className="hover:text-[var(--accent)]"
                  >
                    Current affairs
                  </Link>
                  <ChevronRight className="w-3 h-3" aria-hidden />
                  <span className="text-[var(--text-secondary)] truncate max-w-[12rem]">
                    {item.title}
                  </span>
                </nav>
                <p className="learn-kicker mt-2">{item.source.name}</p>
                <h1 className="page-title mt-1">{item.title}</h1>
                <p className="page-subtitle mt-2 max-w-2xl">
                  {formatWhen(item) ? `${formatWhen(item)} · ` : ""}
                  Official source embed — cite and share from Shelf; read full text at
                  the publisher.
                </p>
              </div>
              <Link
                href="/learn/current-affairs"
                className="explore-back-all shrink-0"
              >
                ← All news
              </Link>
            </header>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={() => void copyText(shareUrl, "link")}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--bg-secondary)]"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copied === "link" ? "Copied!" : "Copy link"}
              </button>
              <button
                type="button"
                onClick={() => void copyText(citation, "cite")}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--bg-secondary)]"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied === "cite" ? "Copied!" : "Copy citation"}
              </button>
              <a
                href={item.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--accent)] text-white px-3 py-2 text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Official source
              </a>
            </div>

            {item.shelfSummary ? (
              <section className="explore-section !mt-0">
                <div className="explore-section-head">
                  <h2 className="explore-section-title">Shelf summary</h2>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                  {item.shelfSummary}
                </p>
              </section>
            ) : null}

            {item.factualExcerpt ? (
              <p className="text-sm text-[var(--text-muted)] italic border-l-2 border-[var(--border)] pl-3 my-4 max-w-3xl">
                {item.factualExcerpt}
              </p>
            ) : null}

            <section className="explore-section">
              <div className="explore-section-head">
                <h2 className="explore-section-title">Source preview</h2>
                <p className="explore-section-copy">
                  {showEmbed
                    ? "Embedded from the official publisher."
                    : "This source does not allow embedding — use the official link above."}
                </p>
              </div>
              {showEmbed ? (
                <div className="rounded-[10px] border border-[var(--border)] overflow-hidden bg-[var(--bg-secondary)] min-h-[480px]">
                  <EmbedViewer
                    pageId={`ca-${item.slug}`}
                    title={item.title}
                    url={item.canonicalUrl}
                    embeddableHint={item.embeddable}
                  />
                </div>
              ) : (
                <div className="learn-empty">
                  {item.linkStatus === "BROKEN"
                    ? "The source link appears unavailable. The Shelf summary above is still citeable."
                    : "Open the official source to read the full article."}
                </div>
              )}
            </section>

            <p className="text-[11px] text-[var(--text-muted)] italic mt-4 max-w-3xl">
              {item.disclaimer}
            </p>

            {item.learnPath ? (
              <Link
                href={item.learnPath}
                className="inline-block mt-4 text-sm text-[var(--accent)] hover:underline"
              >
                Also in Learn catalog →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </CurrentAffairsWorkspace>
  );
}
