import type { LegalSection } from "./types";

/** Interim Terms sections (1–12). Pending counsel review. */
export const TERMS_SECTIONS_PART1: LegalSection[] = [
  {
    heading: "1. Agreement; interim nature; definitions",
    paragraphs: [
      "These Terms of Service (“Terms”) form a binding agreement between you and Shelf (also “myshelflib”, “we”, “us”, “our”) governing access to and use of our websites, progressive web apps, APIs, Study AI, Learn catalog, quizzes, planner, sharing, integrations, and related services (the “Service”).",
      "IMPORTANT: These Terms are a thorough interim template prepared for product launch coverage until reviewed and customized by a licensed lawyer for your entity, jurisdictions, and contracts. They are not legal advice and do not guarantee compliance or litigation outcomes. By using the Service you still agree to these Terms as posted.",
      "Related documents incorporated by reference: Privacy Policy (/legal/privacy), Copyright & takedown (/legal/copyright), in-product plan descriptions, and any order/checkout terms shown at payment.",
      "“User Content” means materials you upload, create, paste, annotate, generate with our tools, or otherwise provide. “Learn Content” means public curriculum, links, summaries, and related catalog materials we make available. “AI Features” means Study AI, reader Ask, quiz generation/grading, summaries, mind maps, flashcards, writing assist, originality checks, and similar automated tools.",
    ],
  },
  {
    heading: "2. Eligibility; accounts; authentication",
    paragraphs: [
      "You must be at least 13 years old, or the higher minimum age of digital consent in your jurisdiction. If you are under 18, you represent that a parent or legal guardian has reviewed and agreed to these Terms on your behalf and permits your use.",
      "You may register with email and password (email OTP verification), Google sign-in, or Telegram Login Widget where enabled. You must provide accurate information and keep credentials confidential. JWT/session tokens stored in your browser (e.g. localStorage) are part of your login security—do not share devices without logging out.",
      "You are responsible for all activity under your account. Notify us promptly of unauthorized access. We may refuse, suspend, reclaim, or terminate accounts for violations, fraud risk, chargebacks, abuse, inactivity coupled with legal risk, or to protect the Service or others.",
      "Password reset and account emails are sent to your registered address. Keep that address current. Admin roles, if any, have additional privileges and responsibilities.",
    ],
  },
  {
    heading: "3. Description of the Service; changes; betas",
    paragraphs: [
      "Shelf is a personal study library and workflow tool. Features may include: private library organization (collections/folders, topics, pages); uploads (PDF, text/Markdown, DOCX, notebooks, Docs, images); link and YouTube video pages; reading, highlighting, pens, progress sync; Study AI with library scope and relevancy/syllabus docs; planner tasks/events; quizzes (practice or soft proctoring); Learn/Explore public catalog and current-affairs style feeds; sharing (email invites and link tokens); Telegram bot import/share where linked; Spotify URL embeds (no Shelf Spotify OAuth); PWA/offline caches; Premium plans and quotas.",
      "We may modify, add, remove, or discontinue features, models, quotas, UI, or APIs at any time. We may offer beta or experimental features “as is,” which may be unstable or withdrawn without notice. Free and paid tiers have different limits (storage, AI tokens/modes, vector indexing, relevancy docs, chat length, and similar). We may throttle, queue, or refuse requests that threaten stability, cost, or fair use.",
    ],
  },
  {
    heading: "4. Acceptable use",
    paragraphs: ["You agree not to, and not to allow others to:"],
    bullets: [
      "Violate any law (copyright, privacy, cybercrime, export, sanctions, child-protection, exam-integrity rules of your institution, etc.).",
      "Upload or share pirated books, unauthorized scans, malware, ransomware, or content you lack rights to process.",
      "Upload or generate CSAM or any sexual content involving minors; we will report and cooperate with authorities as required.",
      "Harass, threaten, defraud, dox, spam, or impersonate others; or misuse share links to attack or surveil people.",
      "Probe, scan, penetrate, overload, or disrupt our systems; bypass rate limits, auth, paywalls, or quotas; or reverse engineer except where mandatory law allows.",
      "Scrape, bulk-harvest, resell, or create competing datasets from the Service, Learn Content, or AI outputs in a way that harms us or rights holders.",
      "Use AI Features or quizzes to cheat on live/proctored institutional exams where prohibited, or to submit AI work as solely human-authored where disclosure is required.",
      "Attempt to extract model weights, system prompts, or other users’ private libraries.",
      "Use the Service for high-risk automated decisions (credit, employment, housing, insurance, medical diagnosis) without human review required by law.",
      "Misrepresent affiliation with Shelf or use our marks without permission.",
    ],
  },
  {
    heading: "5. User Content; license; sharing; backups",
    paragraphs: [
      "You retain ownership of your User Content. You grant Shelf a worldwide, non-exclusive, royalty-free, sublicensable (to processors) license to host, store, reproduce, transmit, display, modify (e.g. format conversion, OCR, HTML generation), index (including embeddings/vector search), backup, analyze for security/abuse, and otherwise process User Content solely to operate, secure, personalize, and provide the Service to you and recipients you authorize.",
      "You represent that you have all rights and consents needed, and that User Content does not infringe others’ rights or contain unlawful material. Do not upload third-party confidential information unless authorized.",
      "Sharing: private by default. You may grant view/edit access by email invite or enable anyone-with-link tokens. Recipients may save a copy into their own library where the product allows—those copies become their User Content. You are solely responsible for whom you share with and for link leakage.",
      "Processing pipelines may create derivatives (content.html, thumbnails, embeddings, OCR text). Deleting a page generally removes associated indexes over time, subject to backups and shared copies already saved by others.",
      "We are not a backup service of last resort. Export or keep local copies of important materials. Local IndexedDB/localStorage caches can be lost if you clear site data, change browsers, or logout.",
    ],
  },
  {
    heading: "6. Copyright; Learn Content; takedown",
    paragraphs: [
      "Learn/Explore primarily links to official sources and may show short excerpts, summaries, or—when embedding fails and our policies allow—official document previews or mirrored PDFs with source attribution. Government and educational materials may be treated differently under local law; that does not waive rights holders’ claims. See /legal/copyright.",
      "You must not use Learn Content or mirrors for commercial republication outside personal study without lawful rights. We may remove or geo-restrict materials and suspend repeat infringers. Valid notices should follow the Copyright page (identity, work, URL, good-faith statements) emailed to our contact address.",
      "DMCA-style and Indian IT Act/IT Rules notice-and-takedown processes may apply depending on the claim and hosting role. Counter-notices, if available, do not guarantee restoration.",
    ],
  },
  {
    heading: "7. Study AI and automated features",
    paragraphs: [
      "AI Features may use third-party large language models and tools (including retrieval over your library, web search/URL fetch where enabled, quiz grading with vision models, and similar). Prompts, selections, retrieved snippets, images, and metadata may be sent to processors under their terms and our Privacy Policy.",
      "Outputs may be wrong, incomplete, biased, outdated, or fabricated (“hallucinations”). They are not legal, medical, financial, counseling, immigration, or academic-integrity advice. Verify against primary sources before relying on them for exams, publications, or decisions.",
      "We do not guarantee exam ranks, grades, originality scores, plagiarism-tool parity, or institutional acceptance of AI-assisted work. Soft quiz “proctoring” (fullscreen/tab focus) is a client-side integrity aid only—not webcam invigilation, not a substitute for institutional exam security, and not a guarantee against cheating.",
      "You must not paste secrets (passwords, API keys, regulated health data, others’ personal data) into AI Features unless you accept processor processing. Tool actions (planner create/update, quiz start, web fetch) happen under your account responsibility.",
    ],
  },
  {
    heading: "8. Quizzes; practice vs soft proctoring",
    paragraphs: [
      "Quizzes may be generated from your library, uploads, or exam-bank style sources. Practice mode allows freer navigation; proctored mode may require fullscreen and treat tab switches or leaving fullscreen as auto-submit events recorded with an end reason.",
      "Quiz attempts, answers (including photo-of-working images), timing, and analysis boards are private account data unless you share them. Do not use Shelf quizzes as official high-stakes exams for third parties without separate legal arrangements.",
    ],
  },
  {
    heading: "9. Telegram, YouTube, Spotify, and other integrations",
    paragraphs: [
      "Telegram: optional bot linking may import forwarded PDFs into your library and enable share-to-Telegram. Telegram’s terms and privacy policy apply. Unlinking does not automatically delete already-imported files.",
      "YouTube: watch URLs/playlists may be stored as library video pages and embedded per YouTube terms. We do not host YouTube media files. Some videos block embedding.",
      "Spotify: paste-a-URL embeds use Spotify’s official player; Shelf does not perform Spotify OAuth. Login and playback follow Spotify’s rules; we store recent URLs locally as needed for UX.",
      "Google sign-in, email delivery, object storage, databases, vector DBs, payment processors (e.g. Razorpay), analytics, and AI vendors are third parties. Outages, policy changes, or content blocks are outside our control.",
    ],
  },
  {
    heading: "10. Plans, payments, taxes, credits",
    paragraphs: [
      "Paid Premium (or other) plans are billed in INR or as shown at checkout via processors such as Razorpay, including UPI Autopay where offered. Prices, intervals, and features are described in-product and may change for future renewals with notice where required.",
      "Fees are generally non-refundable except where mandatory consumer law requires otherwise or we expressly agree in writing. Taxes (including GST where applicable) may be added. Failed payment may pause Premium features or downgrade you to Free limits.",
      "Cancel renewal in Settings or via the processor flow; access typically continues until the end of the paid period unless stated otherwise. Coupons, affiliates, and in-app “coins” have no cash value except as applied in-product under stated rules. Chargebacks filed in bad faith may lead to suspension.",
    ],
  },
  {
    heading: "11. Intellectual property; feedback; license to you",
    paragraphs: [
      "Shelf branding, software, UI, documentation, and non-user Learn packaging are owned by us or licensors. We grant you a limited, revocable, non-transferable, non-exclusive license to use the Service for personal or internal study purposes per these Terms—not to copy, mirror, or resell the platform.",
      "Feedback, ideas, and suggestions may be used by us freely without attribution or compensation. AI outputs are provided to you under these Terms; third-party model licenses may impose additional restrictions—you must comply.",
    ],
  },
  {
    heading: "12. Privacy; data protection; security incidents",
    paragraphs: [
      "Personal data is processed as described in the Privacy Policy. For Indian users, we act as a Data Fiduciary (or analogous role) for account data we determine purposes for; processors act on our instructions. Enterprise or institutional arrangements, if any, may reverse roles under a separate DPA.",
      "You must not use the Service to process special-category or children’s data unlawfully. Report suspected account compromise to our contact email promptly.",
    ],
  },
];
