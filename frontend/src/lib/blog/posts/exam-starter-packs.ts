import { buildPost } from "../types";

export const examStarterPacks = buildPost(
  {
    slug: "exam-starter-packs-and-current-affairs-briefs",
    title: "Exam Starter Packs and Original Current Affairs Briefs on Shelf",
    description:
      "Shelf Learn now ships syllabus-mapped starter packs for UPSC, State PCS, Judiciary, CA, NEET PG and GATE, plus current affairs briefs written from multiple reported sources.",
    excerpt:
      "Every starter pack page is written against a syllabus checklist, audited for coverage and factual risk, and published with a diagram — and current affairs briefs are synthesised from several publishers rather than restating one.",
    publishedAt: "2026-09-01",
    updatedAt: "2026-09-01",
    tags: ["learn", "upsc", "current affairs", "study material"],
    readingMinutes: 6,
  },
  [
    {
      heading: "Starter packs for every exam track",
      paragraphs: [
        "Until now, Shelf Learn pointed you at official sources: NCERT textbooks, PIB releases, ICAI material, court judgments. That is the right primary material, but it leaves a gap. A first-time aspirant opening the Seventh Schedule cold does not yet have the scaffolding to read it well.",
        "Starter packs fill that gap. Each study goal now has a pack of syllabus-mapped pages that explain the core concepts before you go to the primary source — and each page links out to the official material it was written against.",
        "Crucially, packs are organised the way the exam itself is organised, not as a flat list of topics. A pack is divided into subjects, each subject is tagged with the paper it belongs to, and each subject holds its own topics and pages. UPSC Economy is not one overview note — it is national income, inflation, the LAF corridor, GST, MSP, PLI and so on, each as its own page.",
      ],
      bullets: [
        "UPSC: ten subjects across GS Papers I to IV — polity, economy, history, geography, environment, society, international relations, science and internal security, ethics, and exam strategy.",
        "State PCS: polity and public administration, economy and development, and a state-specific module — with the core kept state-agnostic and a method for localising it to your own state.",
        "Judiciary: civil law, criminal law and procedure, and evidence with judgment craft — covering the 2023 Sanhitas alongside the IPC, CrPC and Evidence Act provisions they replace.",
        "CA: accounting and financial reporting, auditing and assurance, taxation, and corporate law with exam strategy.",
        "NEET PG: pre and para-clinical sciences, medicine and allied, surgery with obstetrics and paediatrics, and community medicine with exam strategy.",
        "GATE: engineering mathematics, core engineering concepts, and general aptitude with exam craft.",
      ],
    },
    {
      heading: "Written against a checklist, not a vibe",
      paragraphs: [
        "Generic AI writing goes wrong on exam material in a specific way: it sounds fluent and quietly skips the thing the syllabus actually asks for. Shelf avoids that by never asking a model to write freely.",
        "Every page starts from a blueprint that carries the verbatim syllabus line it serves, a checklist of points that must be genuinely explained, the comparisons or numericals it has to work through, the mistakes candidates actually make on that topic, and the official sources the text has to stay consistent with.",
        "After the draft, a reviewer pass audits the page against that same checklist on three axes. Is every checklist point explained, or merely name-dropped? Is any section number, case name, year or statistic wrong? And — the one that matters most here — does any passage assert that something is important without teaching it? Filler is flagged by quotation and the page is rewritten to spend those words on what was missing.",
        "Pages that still score poorly are held back rather than published. The score for every page is visible in the admin dashboard, so nothing reaches Learn without a recorded review.",
      ],
    },
    {
      heading: "Long enough to actually teach",
      paragraphs: [
        "A page that can be skimmed in ninety seconds is a summary, and you already have summaries. Starter pack pages run 1,800 to 2,400 words across eight to ten sections, which is roughly a chapter of a standard reference book — enough room to define a concept precisely, then show it working.",
        "Each page carries at least two comparison tables, because a lot of exam content is fundamentally comparative: two competing tests, a provision before and after an amendment, one classification against another. Technical subjects also carry a worked example: a full deficit computation for economy, an input tax credit calculation for CA, a stepwise ABG interpretation for NEET PG, a system solved by row reduction for GATE.",
        "Every page closes the same way, so revision has a predictable shape: key takeaways, how the topic is actually asked, the common mistakes to avoid, and the other syllabus areas it connects to.",
      ],
    },
    {
      heading: "Diagrams that belong to the page",
      paragraphs: [
        "Reading a causal chain as a paragraph is harder than seeing it as steps. Each page carries a diagram chosen for the topic — flow, timeline, comparison, hierarchy, cycle or cards — plus a four-card 'at a glance' strip. These are part of the page HTML, so they stay readable on a phone, work in dark mode, and can be highlighted like any other text.",
        "Diagrams are part of the page itself rather than images bolted on, so they stay readable on a phone, work in dark mode, and can be highlighted like any other text.",
      ],
    },
    {
      heading: "Current affairs briefs written from several sources",
      paragraphs: [
        "Shelf already scrapes official and press sources for current affairs. The new briefs go a step further: instead of showing you one outlet's summary, Shelf groups items that several publishers covered and writes an original brief from the facts they share.",
        "That design is deliberate on two fronts. Corroboration across publishers is what makes a fact safe to state, and writing from shared facts rather than one source's phrasing is what keeps the brief Shelf's own work. Each brief is audited for claims the sources do not support and for any phrasing that stayed too close to the original, and it is held back if either check fails. Every source that fed a brief is named and linked at the bottom of the page.",
      ],
    },
    {
      heading: "Where to find them",
      paragraphs: [
        "Open Learn and pick your exam. Starter packs appear as their own collection for that track — UPSC starter pack, CA starter pack, and so on — sitting alongside the official sources you already browse. Current affairs briefs are grouped by month under a briefs collection for your track.",
        "If you set a study goal during onboarding, Learn already filters to your track, so the pack for your exam is the first thing you see. Changing your goal in settings switches the packs on offer without losing anything you have saved.",
      ],
    },
    {
      heading: "What these pages are not",
      paragraphs: [
        "A starter pack is a first pass, not a replacement for the standard books or the bare act. It is written to get you to the point where the primary source reads easily, and every page names the sources it was written against so you can go verify.",
        "The same honesty applies to current affairs. A brief covers what several publishers agreed on; where reporting diverges or a detail is not corroborated, the brief leaves it out rather than picking a side. For the full reporting, open the linked sources.",
        "We also hold back rather than publish when a page fails its own review. You will see fewer pages than the blueprint lists on any given day, which is the intended trade: a smaller catalog you can trust beats a complete one you have to second-guess.",
      ],
    },
    {
      heading: "What this means for your revision",
      paragraphs: [
        "Starter packs give you a defensible first pass on a topic, with the primary source one click away for the depth. Briefs give you current affairs already mapped to syllabus areas, with prelims pointers and a mains angle attached.",
        "Both live in Learn alongside the official catalog, and both can be saved into your own library at /my-content, where highlights, notes, the planner and Study AI work on them exactly as they do on your own PDFs.",
      ],
    },
  ]
);
