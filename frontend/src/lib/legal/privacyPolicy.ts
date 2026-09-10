import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_EFFECTIVE_DATE,
  type LegalDocument,
} from "./types";
import { PRIVACY_SECTIONS_PART1 } from "./privacySectionsPart1";
import { PRIVACY_SECTIONS_PART2 } from "./privacySectionsPart2";

/** Comprehensive interim Privacy Policy — have a lawyer review for DPDP/GDPR/CCPA and your entity. */
export const PRIVACY_POLICY: LegalDocument = {
  id: "privacy",
  title: "Privacy Policy",
  shortTitle: "Privacy Policy",
  path: "/legal/privacy",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  lastUpdated: LEGAL_EFFECTIVE_DATE,
  intro: `This Privacy Policy explains how Shelf (“myshelflib”, “we”, “us”) collects, uses, stores, shares, and protects personal information when you use our Service. It is written as a thorough interim notice covering Shelf’s real features and common requirements under India’s DPDP Act, GDPR/UK GDPR, and CCPA/CPRA-style rights—until customized by counsel. It is not legal advice. For use of the Service, also see our Terms of Service. Contact: ${LEGAL_CONTACT_EMAIL}.`,
  sections: [...PRIVACY_SECTIONS_PART1, ...PRIVACY_SECTIONS_PART2],
};
