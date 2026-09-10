import type { LegalSection } from "./types";
import { LEGAL_CONTACT_EMAIL } from "./types";

/** Interim Privacy sections (13–22). Pending counsel review. */
export const PRIVACY_SECTIONS_PART2: LegalSection[] = [
  {
    heading: "13. Your rights (overview)",
    paragraphs: [
      "Depending on your location, you may have some or all of the following rights regarding personal data we hold about you. To exercise rights, email the contact below from your account email (or verify identity another way we reasonably request). We may ask for information to confirm identity and will respond within timelines required by law (often about 30 days under GDPR; DPDP Rules may set specific grievance timelines). In-product controls include: edit profile, delete pages, revoke shares, unlink Telegram, cancel Premium, and delete account from Profile.",
    ],
    bullets: [
      "Access / know what we process and obtain a copy.",
      "Correction / completion of inaccurate or incomplete data.",
      "Deletion / erasure (subject to legal retention exceptions).",
      "Portability / export of data you provided, where applicable.",
      "Restriction or objection to certain processing (including legitimate-interests balancing).",
      "Withdraw consent where processing is consent-based.",
      "Appeal or lodge a complaint with a supervisory authority / Data Protection Board.",
      "Nominate (where DPDP allows) another person to exercise rights on your behalf in case of death or incapacity—contact us for process when available.",
    ],
  },
  {
    heading: "14. India — DPDP Act rights & grievance",
    paragraphs: [
      "If you are in India, you are a Data Principal under the Digital Personal Data Protection Act, 2023. You may request access, correction, erasure, and withdrawal of consent for consent-based processing, and you may nominate as the Act allows.",
      `Grievance / Data protection contact: ${LEGAL_CONTACT_EMAIL}. Please include “Privacy grievance” in the subject, your account email, and a clear description. We will acknowledge and work to resolve within applicable timelines. If unresolved, you may approach the Data Protection Board of India as that mechanism becomes available for your complaint type.`,
      "Consent for account creation is collected via an unchecked checkbox linking to these Terms and this Policy. You can stop using the Service and delete your account to end most processing.",
    ],
  },
  {
    heading: "15. European Economic Area / UK",
    paragraphs: [
      "If GDPR/UK GDPR applies, our legal bases are described above. You may contact your local data protection authority. Where we rely on legitimate interests, you may object. Where we use processors, they are bound by Article 28-style contracts where required. International transfers use appropriate safeguards.",
      "We do not generally make solely automated decisions that produce legal or similarly significant effects about you without human involvement; AI study tools are assistive and user-directed.",
    ],
  },
  {
    heading: "16. California and other US state laws",
    paragraphs: [
      "If you are a California resident, the CCPA/CPRA may grant rights to know, access, correct, delete, and to be free from discrimination for exercising privacy rights. We do not sell personal information or share it for cross-context behavioral advertising as those terms are commonly defined in our consumer Service. Sensitive personal information (if any) is used only for permitted purposes such as providing the Service you request.",
      "You may submit requests via the contact email. We will verify and respond as required. Authorized agents may submit requests with proof of authority. Other US state privacy laws (Virginia, Colorado, etc.) may provide similar rights—contact us and we will handle in line with applicable law.",
      "Global Privacy Control (GPC): if we deploy sale/share opt-out signals in future advertising contexts, we will describe them here; today our consumer Service is not ad-tech oriented.",
    ],
  },
  {
    heading: "17. Sensitive and special-category data",
    paragraphs: [
      "Please avoid uploading government IDs, biometric templates, health records, precise financial account numbers, or special-category data unless necessary and lawful. If you do, you acknowledge the risk and instruct us to process it only to store/display it as part of your library or AI request. We do not require such data for basic use.",
    ],
  },
  {
    heading: "18. Third-party sites and embeds",
    paragraphs: [
      "Learn links, YouTube/Spotify embeds, payment pages, and OAuth screens are operated by third parties with their own policies. We are not responsible for their practices. Review their privacy notices before authenticating or uploading there.",
    ],
  },
  {
    heading: "19. Soft proctoring and exam integrity signals",
    paragraphs: [
      "In proctored quiz mode we may record client-side events such as leaving fullscreen or switching tabs to auto-submit and label an end reason. We do not currently capture webcam video, microphone audio, or continuous screen recording for proctoring. Institutions should not treat Shelf soft proctoring as certified remote invigilation.",
    ],
  },
  {
    heading: "20. Automated processing and profiling",
    paragraphs: [
      "We may use limited profiling for product personalization (e.g. continue-reading, study-goal UX, quota enforcement, abuse detection). This is not credit scoring or employment screening.",
    ],
  },
  {
    heading: "21. Changes to this Policy",
    paragraphs: [
      "We may update this Policy and will revise the “Last updated” date. Material changes may also be notified by email or in-product banner. Continued use after the effective date acknowledges the updated Policy. If you disagree, delete your account and stop using the Service.",
    ],
  },
  {
    heading: "22. Contact",
    paragraphs: [
      `Privacy, DPDP grievances, and data-subject requests: ${LEGAL_CONTACT_EMAIL}.`,
      `Security issues: ${LEGAL_CONTACT_EMAIL} with subject “Security”.`,
      "Postal address and company legal name will be added when finalized by counsel / business registration details—until then email is the primary channel.",
    ],
  },
];
