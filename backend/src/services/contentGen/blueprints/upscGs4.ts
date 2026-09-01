import type { StarterSubject } from "../types.js";

const DOPT = "https://dopt.gov.in/";
const CVC = "https://cvc.gov.in/";
const UPSC_EXAMS = "https://upsc.gov.in/examinations/active-examinations";
const ARC = "https://darpg.gov.in/";

export const UPSC_ETHICS: StarterSubject = {
  slug: "upsc-ethics",
  name: "Ethics, Integrity & Aptitude",
  description:
    "Ethical theory, administrative values and case-study reasoning for GS Paper IV.",
  paper: "GS Paper IV",
  topics: [
    {
      slug: "ethical-foundations",
      title: "Ethical Foundations",
      articles: [
        {
          slug: "ethics-essence-and-determinants",
          title: "Ethics, Morality and Law: Essence, Determinants and Consequences",
          syllabusAnchor:
            "GS Paper IV — Ethics and human interface: essence, determinants and consequences of ethics in human actions; dimensions of ethics.",
          mustCover: [
            "How ethics, morality, values and law differ, and where they overlap",
            "Determinants of ethics: family, society, education, religion, law and institutions",
            "Descriptive, normative, meta and applied ethics as the four dimensions",
            "Consequentialist reasoning and utilitarianism, with its distributive weakness",
            "Deontological reasoning and Kant's categorical imperative, with its rigidity problem",
            "Virtue ethics and the shift from 'what should I do' to 'what kind of person should I be'",
            "Why public administration cannot rely on a single framework, and how the three are used together",
          ],
          worked: [
            "Take one administrative dilemma and reason through it three times — consequentialist, deontological and virtue-based — showing where the three diverge",
          ],
          traps: [
            "Treating utilitarianism as 'whatever benefits the majority' without addressing the harm to the minority",
            "Listing philosophers without applying their framework to an administrative situation",
          ],
          officialSources: [DOPT],
          diagram: "compare",
          keywords: [
            "ethics and human interface",
            "determinants of ethics UPSC",
            "deontology vs utilitarianism",
            "GS Paper 4 notes",
          ],
          order: 0,
        },
        {
          slug: "attitude-and-emotional-intelligence",
          title: "Attitude, Aptitude and Emotional Intelligence in Administration",
          syllabusAnchor:
            "GS Paper IV — Attitude: content, structure, function; its influence and relation with thought and behaviour; emotional intelligence: concepts and their utilities and application in administration and governance.",
          mustCover: [
            "Structure of attitude: the cognitive, affective and behavioural components",
            "Functions attitude serves: knowledge, ego-defence, value-expression and adjustment",
            "Why attitude and behaviour diverge, and what closes the gap",
            "Attitude change: persuasion, cognitive dissonance and the role of social influence",
            "Emotional intelligence: self-awareness, self-regulation, motivation, empathy and social skill",
            "How empathy changes the quality of a public grievance interaction",
            "Aptitude and foundational values distinguished from personality traits",
          ],
          worked: [
            "Show how a civil servant with high self-regulation and low self-regulation would handle the same provocation differently, and what follows for the outcome",
          ],
          traps: [
            "Reducing emotional intelligence to 'being nice' rather than regulated and accurate perception of emotion",
            "Describing attitude without connecting it to an administrative consequence",
          ],
          officialSources: [DOPT, ARC],
          diagram: "hierarchy",
          keywords: [
            "emotional intelligence administration",
            "attitude components UPSC",
            "aptitude foundational values",
          ],
          order: 1,
        },
      ],
    },
    {
      slug: "public-service-values",
      title: "Values in Public Service",
      articles: [
        {
          slug: "foundational-values-civil-service",
          title: "Foundational Values for Civil Service and the Conflicts Between Them",
          syllabusAnchor:
            "GS Paper IV — Aptitude and foundational values for civil service: integrity, impartiality and non-partisanship, objectivity, dedication to public service, empathy, tolerance and compassion towards the weaker sections.",
          mustCover: [
            "Each named value defined precisely and distinguished from its neighbours",
            "Integrity as consistency between stated values and action, not merely absence of corruption",
            "Impartiality and non-partisanship, and why they are different obligations",
            "Objectivity as evidence-led decision-making and its tension with compassion",
            "Dedication to public service and the idea of the public interest",
            "Conflict of interest: what creates one and what discharging it requires",
            "How these values conflict with each other in practice, and how a decision-maker sequences them",
          ],
          worked: [
            "Construct one situation where impartiality and compassion pull in opposite directions, and reason to a defensible resolution",
          ],
          traps: [
            "Listing values as synonyms instead of showing what each one uniquely demands",
            "Resolving every dilemma by asserting integrity without showing the trade-off",
          ],
          officialSources: [DOPT, CVC],
          diagram: "hierarchy",
          keywords: [
            "foundational values civil services",
            "integrity impartiality objectivity",
            "conflict of interest ethics",
          ],
          order: 0,
        },
        {
          slug: "probity-in-governance",
          title: "Probity in Governance: Institutions, Codes and Corruption",
          syllabusAnchor:
            "GS Paper IV — Probity in governance: concept of public service; philosophical basis of governance and probity; information sharing and transparency in government; codes of ethics, codes of conduct, citizen's charters; challenges of corruption.",
          mustCover: [
            "Probity distinguished from mere legality",
            "Codes of ethics and codes of conduct: what each does and why both are needed",
            "The Central Vigilance Commission and the Lokpal and Lokayuktas framework",
            "The Prevention of Corruption Act and the shift the 2018 amendment made",
            "Right to Information as a probity instrument, and its Section 4 proactive disclosure duty",
            "Citizen's charters and service delivery guarantees, and why enforcement is the weak link",
            "Causes of corruption: monopoly, discretion and weak accountability, and what each implies for the remedy",
          ],
          worked: [
            "Apply the monopoly-plus-discretion-minus-accountability framing to one public service and identify which lever actually reduces the leakage",
          ],
          traps: [
            "Treating corruption purely as a moral failing without addressing the institutional design that enables it",
            "Confusing the Lokpal's jurisdiction with the CVC's",
          ],
          officialSources: [CVC, ARC, "https://rti.gov.in/"],
          diagram: "flow",
          keywords: [
            "probity in governance",
            "Prevention of Corruption Act",
            "Lokpal CVC ethics",
            "codes of conduct governance",
          ],
          order: 1,
        },
        {
          slug: "case-study-method",
          title: "Answering GS Paper IV Case Studies: A Reusable Method",
          syllabusAnchor:
            "GS Paper IV — Case studies on the above issues.",
          mustCover: [
            "What the examiner is testing: identification of stakeholders, ethical issues, options and a defensible choice",
            "A repeatable structure: facts, stakeholders, ethical issues at stake, options with merits and demerits, decision, and justification",
            "Identifying the real dilemma rather than the surface conflict",
            "Weighing short-term and long-term consequences on each stakeholder",
            "Why the chosen option must be legal, feasible and ethically defensible together",
            "How to state a decision without hedging, and how to acknowledge the cost of the option not taken",
            "Time and word management across a case-study-heavy paper",
          ],
          worked: [
            "Apply the full structure end to end to one dilemma involving pressure from a superior, showing the option table before the decision",
          ],
          traps: [
            "Listing every option without committing to one",
            "Choosing the ethically pure option while ignoring feasibility, or the feasible option while ignoring the ethics",
            "Writing generic value statements instead of engaging with the specific facts given",
          ],
          officialSources: [UPSC_EXAMS, DOPT],
          diagram: "flow",
          keywords: [
            "GS Paper 4 case study approach",
            "ethics case study answer structure",
            "UPSC ethics answer writing",
          ],
          order: 2,
        },
      ],
    },
  ],
};

export const UPSC_STRATEGY: StarterSubject = {
  slug: "upsc-exam-strategy",
  name: "Exam Strategy",
  description:
    "How the Civil Services Examination is structured and how to prepare for all three stages together.",
  paper: "Prelims, Mains & Interview",
  topics: [
    {
      slug: "preparation-plan",
      title: "Preparation Plan",
      articles: [
        {
          slug: "integrated-prelims-mains-strategy",
          title: "An Integrated Prelims and Mains Preparation Strategy",
          syllabusAnchor:
            "UPSC Civil Services Examination scheme: Preliminary Examination, Main Examination and Personality Test.",
          mustCover: [
            "The three stages and how candidates are filtered at each",
            "Prelims: GS Paper I for merit and CSAT as qualifying, and what that implies for effort allocation",
            "Mains: the essay paper, four General Studies papers, the optional papers and the qualifying language papers",
            "Why static and current affairs must be studied as one integrated stream rather than separately",
            "Source discipline: a limited book list revised repeatedly beats wide reading done once",
            "Answer writing as a separate trainable skill, and how early to start it",
            "A realistic twelve-month cycle with revision built in rather than appended",
          ],
          worked: [
            "Lay out a sample week that services prelims revision, mains answer writing and current affairs together, and justify the split",
          ],
          traps: [
            "Postponing answer writing until after the syllabus is 'complete'",
            "Treating CSAT as automatic and discovering the aptitude gap too late",
            "Collecting material continuously instead of revising a fixed set",
          ],
          officialSources: [UPSC_EXAMS],
          diagram: "flow",
          keywords: [
            "UPSC preparation strategy",
            "prelims mains integrated preparation",
            "civil services study plan",
            "UPSC answer writing practice",
          ],
          order: 0,
        },
      ],
    },
  ],
};
