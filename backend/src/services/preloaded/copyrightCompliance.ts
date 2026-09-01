import type { IngestLicense } from "@prisma/client";
import { ALL_PRELOADED_CATALOG } from "./catalogIndex.js";
import { DEFAULT_INGEST_SOURCES } from "../ingest/sourceRegistry.js";
import { parsePublicHttpUrl } from "../../utils/publicUrl.js";
import { isPdfUrl } from "../curriculumSavePolicy.js";
import type { PreloadedCatalogEntry } from "./types.js";

/** Hostnames we treat as OK for admin/public PDF mirror, proxy, and ingest fetch. */
export const OFFICIAL_REDISTRIBUTION_HOSTS = new Set([
  "ncert.nic.in",
  "upsc.gov.in",
  "indiabudget.gov.in",
  "www.indiabudget.gov.in",
]);

export type CopyrightSeverity = "ok" | "warn" | "error";

export type CopyrightFinding = {
  severity: CopyrightSeverity;
  code: string;
  message: string;
  slug?: string;
  url?: string;
  license?: IngestLicense | null;
};

export type CopyrightAuditReport = {
  generatedAt: string;
  summary: {
    ok: number;
    warn: number;
    error: number;
    officialDocumentCatalogEntries: number;
    linkOnlyCatalogEntries: number;
  };
  findings: CopyrightFinding[];
  officialDocumentHosts: string[];
  policyNotes: string[];
};

function hostname(url: string): string | null {
  const safe = parsePublicHttpUrl(url);
  if (!safe) return null;
  try {
    return new URL(safe).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isOfficialRedistributionHost(url: string): boolean {
  const host = hostname(url);
  if (!host) return false;
  return OFFICIAL_REDISTRIBUTION_HOSTS.has(host);
}

/** Block admin/user full-PDF fetch when URL is not on the official allowlist. */
export function assertOfficialRedistributionAllowed(url: string): void {
  if (!isOfficialRedistributionHost(url)) {
    const host = hostname(url) ?? "invalid";
    throw new Error(
      `Official PDF redistribution is not allowed for host "${host}". Add only government sources with explicit public distribution rights.`
    );
  }
}

function auditPreloadedEntry(entry: PreloadedCatalogEntry): CopyrightFinding[] {
  const findings: CopyrightFinding[] = [];
  const host = hostname(entry.sourceUrl);

  if (!host) {
    findings.push({
      severity: "error",
      code: "invalid_url",
      message: "Source URL is missing or not a public http(s) URL.",
      slug: entry.slug,
      url: entry.sourceUrl,
      license: entry.license,
    });
    return findings;
  }

  if (entry.license === "OFFICIAL_DOCUMENT") {
    if (!isOfficialRedistributionHost(entry.sourceUrl)) {
      findings.push({
        severity: "error",
        code: "official_host_not_allowlisted",
        message:
          "OFFICIAL_DOCUMENT entry points outside the redistribution allowlist — full PDF mirror/proxy must not run until reviewed.",
        slug: entry.slug,
        url: entry.sourceUrl,
        license: entry.license,
      });
    }

    if (isPdfUrl(entry.sourceUrl) && !entry.sourceUrl.includes("ncert.nic.in")) {
      findings.push({
        severity: "warn",
        code: "official_pdf_non_ncert",
        message:
          "Direct PDF marked OFFICIAL_DOCUMENT — confirm publisher permits third-party hosting (not just linking).",
        slug: entry.slug,
        url: entry.sourceUrl,
        license: entry.license,
      });
    }

    if (!isPdfUrl(entry.sourceUrl)) {
      findings.push({
        severity: "ok",
        code: "official_portal_link",
        message: "Portal/HTML official source — link, iframe, or Shelf summary only (no full-text copy).",
        slug: entry.slug,
        url: entry.sourceUrl,
        license: entry.license,
      });
    }
  }

  if (entry.license === "LINK_ONLY" && isPdfUrl(entry.sourceUrl)) {
    findings.push({
      severity: "warn",
      code: "pdf_marked_link_only",
      message:
        "Direct PDF URL marked LINK_ONLY — verify save/proxy paths cannot download this file publicly.",
      slug: entry.slug,
      url: entry.sourceUrl,
      license: entry.license,
    });
  }

  if (
    entry.license === "LINK_ONLY" &&
    (host.includes("openstax.org") ||
      host.includes("ocw.mit.edu") ||
      host.includes("gutenberg.org"))
  ) {
    findings.push({
      severity: "ok",
      code: "open_access_link_only",
      message: "Open-access publisher kept as LINK_ONLY — no Shelf-hosted full text.",
      slug: entry.slug,
      url: entry.sourceUrl,
      license: entry.license,
    });
  }

  return findings;
}

function auditIngestSource(source: (typeof DEFAULT_INGEST_SOURCES)[number]): CopyrightFinding[] {
  const findings: CopyrightFinding[] = [];
  const host = hostname(source.feedUrl);

  if (source.license === "OFFICIAL_DOCUMENT" && host && !isOfficialRedistributionHost(source.feedUrl)) {
    findings.push({
      severity: "warn",
      code: "ingest_official_watch",
      message:
        "Ingest OFFICIAL_DOCUMENT watcher on a portal — fetched PDFs must be allowlisted before admin storage.",
      slug: source.slug,
      url: source.feedUrl,
      license: source.license,
    });
  }

  if (source.license === "GOVERNMENT_PRESS") {
    findings.push({
      severity: "ok",
      code: "gov_press_rss",
      message: "Government press RSS — excerpt capped at 280 chars; no page scraping.",
      slug: source.slug,
      url: source.feedUrl,
      license: source.license,
    });
  }

  return findings;
}

export function auditCopyrightCompliance(): CopyrightAuditReport {
  const findings: CopyrightFinding[] = [];

  for (const entry of ALL_PRELOADED_CATALOG) {
    findings.push(...auditPreloadedEntry(entry));
  }

  for (const source of DEFAULT_INGEST_SOURCES) {
    findings.push(...auditIngestSource(source));
  }

  const officialDocumentCatalogEntries = ALL_PRELOADED_CATALOG.filter(
    (e) => e.license === "OFFICIAL_DOCUMENT"
  ).length;
  const linkOnlyCatalogEntries = ALL_PRELOADED_CATALOG.filter(
    (e) => e.license === "LINK_ONLY"
  ).length;

  const summary = {
    ok: findings.filter((f) => f.severity === "ok").length,
    warn: findings.filter((f) => f.severity === "warn").length,
    error: findings.filter((f) => f.severity === "error").length,
    officialDocumentCatalogEntries,
    linkOnlyCatalogEntries,
  };

  return {
    generatedAt: new Date().toISOString(),
    summary,
    findings,
    officialDocumentHosts: [...OFFICIAL_REDISTRIBUTION_HOSTS].sort(),
    policyNotes: [
      "Not legal advice — have Indian copyright counsel review before scaling public PDF hosting.",
      "Full PDF mirror/proxy is limited to OFFICIAL_DOCUMENT + hostname allowlist.",
      "GOVERNMENT_PRESS stores ≤280 char RSS excerpts only; LINK_ONLY never downloads full files on save.",
      "Newspaper / paywalled scraping is not implemented.",
      "Study AI vector index runs on user library pages only, not public Learn catalog bytes.",
    ],
  };
}
