import type { LegalSection } from "./types";
import { LEGAL_CONTACT_EMAIL } from "./types";

/** Interim Terms sections (13–24). Pending counsel review. */
export const TERMS_SECTIONS_PART2: LegalSection[] = [
  {
    heading: "13. Confidentiality",
    paragraphs: [
      "Non-public User Content is treated as confidential to you, subject to sharing you enable, legal process, and processor access needed to run the Service. You must keep non-public Service credentials, beta features, and unpublished Learn packaging confidential if disclosed to you under NDA or similar.",
    ],
  },
  {
    heading: "14. Disclaimers of warranties",
    paragraphs: [
      "THE SERVICE, LEARN CONTENT, AND AI FEATURES ARE PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, AND NON-INFRINGEMENT.",
      "WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS; THAT CONTENT OR AI OUTPUTS WILL BE ACCURATE, COMPLETE, OR AVAILABLE; THAT OFFICIAL LINKS OR EMBEDS WILL WORK; OR THAT LOCAL/PWA CACHES WILL PERSIST.",
      "Some jurisdictions disallow certain disclaimers; then they apply to the maximum extent permitted.",
    ],
  },
  {
    heading: "15. Limitation of liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, SHELF AND ITS AFFILIATES, OFFICERS, EMPLOYEES, CONTRACTORS, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES; OR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS OPPORTUNITY; OR COST OF SUBSTITUTE SERVICES—WHETHER BASED IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR OTHERWISE—EVEN IF ADVISED OF THE POSSIBILITY.",
      "OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE CLAIM AROSE OR (B) ONE THOUSAND INDIAN RUPEES (₹1,000).",
      "THESE LIMITATIONS ARE A FUNDAMENTAL BASIS OF THE BARGAIN. CONSUMER LAWS THAT CANNOT BE WAIVED REMAIN AVAILABLE.",
    ],
  },
  {
    heading: "16. Indemnification",
    paragraphs: [
      "You will defend, indemnify, and hold harmless Shelf and its affiliates from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys’ fees) arising out of or related to: (a) your User Content; (b) your use of the Service or AI outputs; (c) your sharing settings; (d) your violation of these Terms or law; (e) your infringement of third-party rights; or (f) disputes between you and people you share with or institutions you attend.",
    ],
  },
  {
    heading: "17. Suspension; termination; account deletion",
    paragraphs: [
      "You may stop using the Service at any time and delete your account via Profile (DELETE account) or by emailing us from your registered address. We may suspend or terminate immediately for Terms violations, legal risk, non-payment, security incidents, or long-term abuse.",
      "On termination, your license ends. We will delete or anonymize personal data and User Content per the Privacy Policy and operational timelines; backups may lag; shared copies saved by others and public Learn Content are not deleted as “your account.” Sections that should survive (licenses already exercised for ops during the term, IP, payment obligations, disclaimers, liability limits, indemnity, dispute terms) survive.",
    ],
  },
  {
    heading: "18. Export; sanctions; restricted use",
    paragraphs: [
      "You represent you are not prohibited from using the Service under applicable export control or sanctions laws, and will not use the Service in embargoed jurisdictions if prohibited. AI and cloud tools may have additional geographic restrictions imposed by vendors.",
    ],
  },
  {
    heading: "19. Government and institutional users",
    paragraphs: [
      "If you use Shelf for or on behalf of a school, coaching center, company, or government body, you represent you have authority to bind that entity, and “you” includes that entity. Separate enterprise agreements, DPAs, or purchase orders—if signed—control over these Terms to the extent of conflict.",
    ],
  },
  {
    heading: "20. Force majeure",
    paragraphs: [
      "We are not liable for delays or failures caused by events beyond reasonable control, including natural disasters, war, terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, accidents, network or cloud-provider failures, strikes, or shortages of transportation, facilities, fuel, energy, labor, or materials.",
    ],
  },
  {
    heading: "21. Changes to these Terms",
    paragraphs: [
      "We may update these Terms by posting a new version and updating the “Last updated” date. For material changes, we may also provide email or in-product notice. Continued use after the effective date constitutes acceptance. If you disagree, discontinue use and delete your account before the changes apply to you.",
    ],
  },
  {
    heading: "22. Governing law; disputes; informal resolution",
    paragraphs: [
      "These Terms are governed by the laws of India, without regard to conflict-of-law principles. Subject to mandatory consumer protections in your place of residence that cannot be waived, courts in India have exclusive jurisdiction.",
      `Before filing a formal claim, you agree to email ${LEGAL_CONTACT_EMAIL} with a brief description of the dispute and allow thirty (30) days for informal resolution. Nothing prevents either party from seeking interim injunctive relief for IP or data-security harm.`,
      "If arbitration or mediation becomes mandatory under a future update or separate agreement, that process will be described in the updated Terms. Class-action waivers apply only where enforceable.",
    ],
  },
  {
    heading: "23. General miscellaneous",
    paragraphs: [
      "These Terms are the entire agreement regarding the Service and supersede prior oral or written terms on the same subject (except separate signed enterprise contracts). If any provision is held unenforceable, it will be modified to the minimum extent necessary and the remainder enforced.",
      "No waiver is implied by delay. You may not assign these Terms without our prior consent; we may assign them in a merger, acquisition, corporate reorganization, or sale of assets. Notices may be sent to your account email or posted in the Service. Headings are for convenience only. Electronic acceptance (checkbox, click-wrap, continued use) is valid.",
      "Language: English controls. Translations, if any, are convenience copies.",
    ],
  },
  {
    heading: "24. Contact; grievance",
    paragraphs: [
      `Product, Terms, and general notices: ${LEGAL_CONTACT_EMAIL}.`,
      `Privacy and data-protection grievances: see Privacy Policy (Grievance / Data protection contact). Copyright notices: /legal/copyright and ${LEGAL_CONTACT_EMAIL}.`,
      "We aim to acknowledge grievances within a reasonable period and resolve them consistent with applicable law (including timelines under Indian IT Rules / DPDP frameworks where they apply).",
    ],
  },
];
