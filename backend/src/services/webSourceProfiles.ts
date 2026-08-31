import { StudyGoal } from "@prisma/client";
import { studyGoalLabel } from "../studyGoal.js";

/** Platforms useful across tracks (articles, Q&A, explainers). */
export const GENERAL_WEB_DOMAINS = [
  "medium.com",
  "quora.com",
  "wikipedia.org",
  "reddit.com",
  "stackoverflow.com",
  "britannica.com",
  "investopedia.com",
] as const;

export type WebSourceScope = "all" | "track" | "general";

export type WebSourceProfile = {
  label: string;
  /** Exam- or track-specific sites to prefer for current affairs / syllabus depth. */
  preferredDomains: readonly string[];
  generalDomains: readonly string[];
};

const UPSC_DOMAINS = [
  "upsc.gov.in",
  "pib.gov.in",
  "prsindia.org",
  "indiaculture.gov.in",
  "mea.gov.in",
  "drishtiias.com",
  "clearias.com",
  "forumias.com",
  "mrunal.org",
  "insightsias.com",
  "thehindu.com",
  "indianexpress.com",
] as const;

const NEET_DOMAINS = [
  "ncbi.nlm.nih.gov",
  "pubmed.ncbi.nlm.nih.gov",
  "who.int",
  "cdc.gov",
  "medlineplus.gov",
  "neetprep.com",
  "medscape.com",
  "geekymedics.com",
  "amboss.com",
] as const;

const GATE_DOMAINS = [
  "gate.iitk.ac.in",
  "nptel.ac.in",
  "geeksforgeeks.org",
  "tutorialspoint.com",
  "engineering.careers360.com",
] as const;

const CA_DOMAINS = [
  "icai.org",
  "incometaxindia.gov.in",
  "gst.gov.in",
  "mca.gov.in",
] as const;

const JUDICIARY_DOMAINS = [
  "indiacode.nic.in",
  "livelaw.in",
  "scconline.com",
  "legalserviceindia.com",
  "lawctopus.com",
] as const;

const PCS_DOMAINS = [
  ...UPSC_DOMAINS,
  "ncert.nic.in",
  "education.gov.in",
] as const;

export const WEB_SOURCE_PROFILES: Record<StudyGoal, WebSourceProfile> = {
  GENERAL: {
    label: "General study",
    preferredDomains: GENERAL_WEB_DOMAINS,
    generalDomains: GENERAL_WEB_DOMAINS,
  },
  UPSC: {
    label: "UPSC / Civil Services",
    preferredDomains: UPSC_DOMAINS,
    generalDomains: GENERAL_WEB_DOMAINS,
  },
  STATE_PCS: {
    label: "State PCS",
    preferredDomains: PCS_DOMAINS,
    generalDomains: GENERAL_WEB_DOMAINS,
  },
  JUDICIARY: {
    label: "Judiciary",
    preferredDomains: JUDICIARY_DOMAINS,
    generalDomains: GENERAL_WEB_DOMAINS,
  },
  CA: {
    label: "CA / ICAI",
    preferredDomains: CA_DOMAINS,
    generalDomains: GENERAL_WEB_DOMAINS,
  },
  NEET_PG: {
    label: "NEET PG / Medicine",
    preferredDomains: NEET_DOMAINS,
    generalDomains: GENERAL_WEB_DOMAINS,
  },
  GATE: {
    label: "GATE",
    preferredDomains: GATE_DOMAINS,
    generalDomains: GENERAL_WEB_DOMAINS,
  },
};

export function webSourceProfile(goal?: StudyGoal | null): WebSourceProfile {
  if (goal && WEB_SOURCE_PROFILES[goal]) return WEB_SOURCE_PROFILES[goal];
  return WEB_SOURCE_PROFILES.GENERAL;
}

export function parseWebSourceScope(raw: unknown): WebSourceScope {
  const v = String(raw ?? "all").toLowerCase();
  if (v === "track" || v === "general") return v;
  return "all";
}

/** Build a Google `site:` OR clause (max domains to keep query short). */
export function siteRestrictClause(
  domains: readonly string[],
  max = 5
): string {
  const picked = domains.slice(0, max);
  if (picked.length === 0) return "";
  return picked.map((d) => `site:${d}`).join(" OR ");
}

export function webSourceHintForGoal(goal?: StudyGoal | null): string {
  const profile = webSourceProfile(goal);
  const track = profile.preferredDomains.slice(0, 6).join(", ");
  const general = profile.generalDomains.slice(0, 4).join(", ");
  return `${studyGoalLabel(goal ?? "GENERAL")}: prefer ${track}; also Medium/Quora/Wikipedia (${general}).`;
}
