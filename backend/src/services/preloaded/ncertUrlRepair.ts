import { checkPublicLink, type PublicLinkCheckResult } from "../publicLinkCheck.js";

/** NCERT renamed many 2024–25 textbook PDFs (often `*ps.pdf` or new book codes). */
const NCERT_PDF_BASENAME_RENAMES: Record<string, string> = {
  hess101: "hess2ps",
  hess1: "gess1ps",
  gegp1: "gegp1ps",
  gegp2: "gegp2ps",
  leps1: "leps1ps",
  leps2: "leps2ps",
  iess4: "jess4ps",
  keec1: "keec1ps",
  leec1: "leec1ps",
  lebo1: "lebo1ps",
  lech1: "lech1ps",
  hess4: "hess4ps",
};

function ncertPdfBasename(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "ncert.nic.in") return null;
    const match = parsed.pathname.match(/\/textbook\/pdf\/([^/]+)\.pdf$/i);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function ncertPdfUrl(basename: string): string {
  return `https://ncert.nic.in/textbook/pdf/${basename}.pdf`;
}

/** Candidate replacement URLs for a broken NCERT textbook PDF link. */
export function ncertPdfRepairCandidates(url: string): string[] {
  const base = ncertPdfBasename(url);
  if (!base) return [];

  const out: string[] = [];
  const add = (candidate: string) => {
    const next = ncertPdfUrl(candidate);
    if (next !== url && !out.includes(next)) out.push(next);
  };

  if (!base.endsWith("ps")) add(`${base}ps`);

  const renamed = NCERT_PDF_BASENAME_RENAMES[base];
  if (renamed) add(renamed);

  // Some class XI physical geography books moved from gegp* → ghgp*ps.
  if (base.startsWith("gegp")) add(base.replace(/^gegp/, "ghgp") + "ps");

  return out;
}

export async function repairNcertPdfLink(
  url: string
): Promise<(PublicLinkCheckResult & { repairedUrl: string }) | null> {
  for (const candidate of ncertPdfRepairCandidates(url)) {
    const result = await checkPublicLink(candidate);
    if (result.linkStatus === "OK") {
      return { ...result, repairedUrl: candidate };
    }
  }
  return null;
}
