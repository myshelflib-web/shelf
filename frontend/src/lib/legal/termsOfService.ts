import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_EFFECTIVE_DATE,
  type LegalDocument,
} from "./types";
import { TERMS_SECTIONS_PART1 } from "./termsSectionsPart1";
import { TERMS_SECTIONS_PART2 } from "./termsSectionsPart2";

/** Comprehensive interim Terms of Service — have a lawyer review before relying on them in disputes. */
export const TERMS_OF_SERVICE: LegalDocument = {
  id: "terms",
  title: "Terms of Service",
  shortTitle: "Terms",
  path: "/legal/terms",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  lastUpdated: LEGAL_EFFECTIVE_DATE,
  intro: `These Terms of Service (“Terms”) govern your access to and use of Shelf (also “myshelflib”, “we”, “us”, or “our”), including our websites, progressive web apps, APIs, Study AI, Learn catalog, quizzes, planner, sharing, integrations, and related services (the “Service”). By creating an account, checking accept, or using the Service, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Service. These documents are thorough interim templates pending attorney review for your entity—not a substitute for legal advice. Contact: ${LEGAL_CONTACT_EMAIL}.`,
  sections: [...TERMS_SECTIONS_PART1, ...TERMS_SECTIONS_PART2],
};
