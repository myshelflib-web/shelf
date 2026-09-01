"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Link2,
  Newspaper,
  Share2,
} from "lucide-react";
import type { CurrentAffairsPublicItem } from "@/lib/seo/currentAffairsFetch";
import { getSiteUrl } from "@/lib/siteUrl";

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

  const showIframe =
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-6 md:px-8 pt-6 pb-4 border-b border-[var(--border)]">
        <Link
          href="/learn/current-affairs"
          className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All current affairs
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <h1 className="page-title">{item.title}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {item.source.name}
              {item.edition ? ` · ${item.edition}` : ""}
              {formatWhen(item) ? ` · ${formatWhen(item)}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
        <div className="max-w-3xl space-y-4">
          {item.shelfSummary && (
            <section className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" />
                Shelf summary
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {item.shelfSummary}
              </p>
            </section>
          )}

          {item.factualExcerpt && (
            <p className="text-sm text-[var(--text-muted)] italic border-l-2 border-[var(--border)] pl-3">
              {item.factualExcerpt}
            </p>
          )}

          {showIframe ? (
            <section className="rounded-[10px] border border-[var(--border)] overflow-hidden bg-[var(--bg-secondary)]">
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" />
                  Embedded source preview
                </span>
                {item.linkStatus === "BLOCKED_EMBED" ? (
                  <span className="text-amber-400">May not embed — use source link</span>
                ) : null}
              </div>
              <iframe
                title={item.title}
                src={item.canonicalUrl}
                className="w-full min-h-[480px] h-[60vh] bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </section>
          ) : (
            <div className="rounded-[10px] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--text-muted)]">
              {item.linkStatus === "BROKEN"
                ? "The source link appears unavailable. Shelf summary is still available above."
                : "This source does not allow embedding. Open the official source to read the full text."}
            </div>
          )}

          <p className="text-[11px] text-[var(--text-muted)] italic">{item.disclaimer}</p>

          {item.learnPath && (
            <Link
              href={item.learnPath}
              className="inline-block text-xs text-[var(--accent)] hover:underline"
            >
              Also in Learn catalog →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
