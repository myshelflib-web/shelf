export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  ordered?: string[];
};

export type LegalDocument = {
  id: "terms" | "privacy";
  title: string;
  shortTitle: string;
  path: string;
  effectiveDate: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export const LEGAL_CONTACT_EMAIL = "hello@shelf.study";
export const LEGAL_EFFECTIVE_DATE = "11 September 2026";
