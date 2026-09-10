import { PRIVACY_POLICY } from "./privacyPolicy";
import { TERMS_OF_SERVICE } from "./termsOfService";
import type { LegalDocument } from "./types";

export type { LegalDocument, LegalSection } from "./types";
export {
  LEGAL_CONTACT_EMAIL,
  LEGAL_EFFECTIVE_DATE,
} from "./types";
export { TERMS_OF_SERVICE } from "./termsOfService";
export { PRIVACY_POLICY } from "./privacyPolicy";

export function getLegalDocument(id: "terms" | "privacy"): LegalDocument {
  return id === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY;
}
