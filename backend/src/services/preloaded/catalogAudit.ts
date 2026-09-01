import { ALL_PRELOADED_CATALOG } from "./catalogIndex.js";
import { repairNcertPdfLink, ncertPdfRepairCandidates } from "./ncertUrlRepair.js";
import {
  checkPublicLink,
  type PublicLinkCheckResult,
} from "../publicLinkCheck.js";
import { isPdfUrl } from "../curriculumSavePolicy.js";
import type { PreloadedCatalogEntry } from "./types.js";

export type CatalogAuditRow = {
  slug: string;
  title: string;
  subjectSlug: string;
  topicSlug: string;
  sourceUrl: string;
  kind: "pdf" | "html";
  httpStatus: number | null;
  linkStatus: string;
  embeddable: boolean | null;
  finalUrl: string;
  repairedUrl: string | null;
  loadable: boolean;
  readerMode: "pdf_viewer" | "iframe" | "summary_fallback";
  issue: string | null;
};

function readerModeFor(row: {
  kind: "pdf" | "html";
  loadable: boolean;
  embeddable: boolean | null;
  linkStatus: string;
}): CatalogAuditRow["readerMode"] {
  if (row.kind === "pdf") {
    return row.loadable ? "pdf_viewer" : "summary_fallback";
  }
  if (row.loadable && row.embeddable === true) return "iframe";
  return "summary_fallback";
}

async function auditUrl(url: string): Promise<{
  result: PublicLinkCheckResult;
  repairedUrl: string | null;
}> {
  let result = await checkPublicLink(url);
  let repairedUrl: string | null = null;

  if (result.linkStatus === "BROKEN" && isPdfUrl(url)) {
    const ncertFixed = await repairNcertPdfLink(url);
    if (ncertFixed) {
      result = ncertFixed;
      repairedUrl = ncertFixed.repairedUrl;
    }
  }

  return { result, repairedUrl };
}

export async function auditPreloadedCatalogEntry(
  entry: PreloadedCatalogEntry
): Promise<CatalogAuditRow> {
  const kind = isPdfUrl(entry.sourceUrl) ? "pdf" : "html";
  const { result, repairedUrl } = await auditUrl(entry.sourceUrl);
  const effectiveUrl = repairedUrl ?? result.finalUrl;
  const loadable =
    result.linkStatus === "OK" ||
    result.linkStatus === "BLOCKED_EMBED" ||
    (result.linkStatus === "UNKNOWN" &&
      result.lastHttpStatus != null &&
      result.lastHttpStatus !== 404 &&
      result.lastHttpStatus < 500);

  let issue: string | null = null;
  if (!loadable) {
    issue =
      result.linkStatus === "BROKEN"
        ? `Link broken (HTTP ${result.lastHttpStatus ?? "unknown"})`
        : `Link status ${result.linkStatus}`;
  } else if (kind === "html" && result.embeddable !== true) {
    issue = "Uses Shelf summary + open in browser (iframe blocked or unavailable)";
  }

  return {
    slug: entry.slug,
    title: entry.title,
    subjectSlug: entry.subjectSlug,
    topicSlug: entry.topicSlug,
    sourceUrl: entry.sourceUrl,
    kind,
    httpStatus: result.lastHttpStatus,
    linkStatus: result.linkStatus,
    embeddable: result.embeddable,
    finalUrl: effectiveUrl,
    repairedUrl,
    loadable,
    readerMode: readerModeFor({
      kind,
      loadable,
      embeddable: result.embeddable,
      linkStatus: result.linkStatus,
    }),
    issue,
  };
}

export async function auditPreloadedCatalog(): Promise<{
  total: number;
  loadable: number;
  broken: number;
  embedBlocked: number;
  pdfBroken: number;
  rows: CatalogAuditRow[];
}> {
  const rows: CatalogAuditRow[] = [];
  for (const entry of ALL_PRELOADED_CATALOG) {
    rows.push(await auditPreloadedCatalogEntry(entry));
  }

  const broken = rows.filter((r) => !r.loadable).length;
  const embedBlocked = rows.filter(
    (r) => r.loadable && r.kind === "html" && r.embeddable !== true
  ).length;
  const pdfBroken = rows.filter((r) => r.kind === "pdf" && !r.loadable).length;

  return {
    total: rows.length,
    loadable: rows.length - broken,
    broken,
    embedBlocked,
    pdfBroken,
    rows,
  };
}

/** Suggest catalog sourceUrl fixes from audit (NCERT repair only). */
export function suggestedCatalogFixes(rows: CatalogAuditRow[]): Array<{
  slug: string;
  from: string;
  to: string;
}> {
  return rows
    .filter((r) => r.repairedUrl && r.repairedUrl !== r.sourceUrl)
    .map((r) => ({
      slug: r.slug,
      from: r.sourceUrl,
      to: r.repairedUrl!,
    }));
}

export { ncertPdfRepairCandidates };
