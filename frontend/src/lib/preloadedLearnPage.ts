import type { ArticleDetail, UserContentType } from "@/types";
import { isPdfSourceUrl, shouldUseLinkEmbed } from "@/lib/linkEmbedPolicy";
import { buildPreloadedSummaryHtml } from "@/lib/preloadedSummaryHtml";

export type ResolvedPreloadedLearnPage = {
  contentType: UserContentType;
  content: string;
  sourceUrl: string | null;
  useLinkEmbed: boolean;
};

/** How a preloaded Learn article should render in the reader. */
export function resolvePreloadedLearnPage(
  article: Pick<
    ArticleDetail,
    | "title"
    | "content"
    | "hasPdf"
    | "sourceUrl"
    | "summary"
    | "embeddable"
    | "linkStatus"
    | "sourceLicense"
  >
): ResolvedPreloadedLearnPage {
  const sourceUrl = article.sourceUrl?.trim() || null;
  const useLinkEmbed = shouldUseLinkEmbed({
    sourceUrl,
    embeddable: article.embeddable,
    linkStatus: article.linkStatus,
    sourceLicense: article.sourceLicense,
  });

  if (article.hasPdf || isPdfSourceUrl(sourceUrl)) {
    return {
      contentType: "PDF",
      content: article.content ?? "",
      sourceUrl,
      useLinkEmbed: false,
    };
  }

  if (sourceUrl && useLinkEmbed) {
    return {
      contentType: "LINK",
      content: "",
      sourceUrl,
      useLinkEmbed: true,
    };
  }

  const summary = article.summary?.trim();
  const content =
    article.content ??
    buildPreloadedSummaryHtml(article.title, sourceUrl, summary ?? "", {
      linkStatus: article.linkStatus,
    });

  return {
    contentType: "HTML",
    content,
    sourceUrl,
    useLinkEmbed: false,
  };
}
