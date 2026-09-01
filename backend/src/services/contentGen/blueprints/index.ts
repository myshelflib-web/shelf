import type { StudyGoal } from "@prisma/client";
import type {
  ResolvedArticleSpec,
  StarterPackBlueprint,
  StarterSubject,
} from "../types.js";
import { UPSC_HISTORY, UPSC_GEOGRAPHY, UPSC_SOCIETY } from "./upscGs1.js";
import { UPSC_POLITY, UPSC_IR } from "./upscGs2.js";
import {
  UPSC_ECONOMY,
  UPSC_ENVIRONMENT,
  UPSC_SCITECH_SECURITY,
} from "./upscGs3.js";
import { UPSC_ETHICS, UPSC_STRATEGY } from "./upscGs4.js";
import { STATE_POLITY, STATE_ECONOMY, STATE_SPECIFIC } from "./statePcs.js";
import {
  JUDICIARY_CIVIL,
  JUDICIARY_CRIMINAL,
  JUDICIARY_EVIDENCE_CRAFT,
} from "./judiciary.js";
import {
  CA_ACCOUNTING,
  CA_AUDIT,
  CA_TAXATION,
  CA_LAW_STRATEGY,
} from "./ca.js";
import {
  NEETPG_PRECLINICAL,
  NEETPG_MEDICINE,
  NEETPG_CLINICAL,
  NEETPG_COMMUNITY_STRATEGY,
} from "./neetPg.js";
import {
  GATE_MATHEMATICS,
  GATE_CORE,
  GATE_APTITUDE_STRATEGY,
} from "./gate.js";
import { GENERAL_LEARNING, GENERAL_EXAM_CRAFT } from "./general.js";

export const STARTER_PACK_BLUEPRINTS: StarterPackBlueprint[] = [
  {
    studyGoal: "UPSC",
    label: "UPSC Civil Services",
    examContext:
      "UPSC Civil Services Examination (Prelims GS Paper I and CSAT; Mains Essay, GS Papers I-IV and optional). Readers are serious first-time aspirants. Depth should match a standard reference book chapter: conceptual clarity first, then constitutional, statutory and institutional specifics with article, section and case names, then the analytical angle a Mains answer needs. Prefer facts that stay stable across years over current statistics.",
    subjects: [
      UPSC_POLITY,
      UPSC_ECONOMY,
      UPSC_HISTORY,
      UPSC_GEOGRAPHY,
      UPSC_ENVIRONMENT,
      UPSC_SOCIETY,
      UPSC_IR,
      UPSC_SCITECH_SECURITY,
      UPSC_ETHICS,
      UPSC_STRATEGY,
    ],
  },
  {
    studyGoal: "STATE_PCS",
    label: "State PCS",
    examContext:
      "State Public Service Commission examinations (UPPSC, BPSC, MPPSC, RPSC and similar). The pattern mirrors UPSC but carries a heavier factual recall load and a compulsory state-specific General Studies component. Keep the core explanation state-agnostic, then show explicitly how a candidate localises the topic to their own state.",
    subjects: [STATE_POLITY, STATE_ECONOMY, STATE_SPECIFIC],
  },
  {
    studyGoal: "JUDICIARY",
    label: "Judicial Services",
    examContext:
      "State Judicial Services (Civil Judge Junior Division) Prelims, Mains and Viva. Readers are law graduates, so precision beats narrative: exact section numbers, correct legal terminology, and a clear line between settled law and academic debate. Reflect the 2023 criminal law overhaul (BNS, BNSS, BSA) alongside the corresponding IPC, CrPC and Evidence Act provisions.",
    subjects: [JUDICIARY_CIVIL, JUDICIARY_CRIMINAL, JUDICIARY_EVIDENCE_CRAFT],
  },
  {
    studyGoal: "CA",
    label: "Chartered Accountancy",
    examContext:
      "ICAI Chartered Accountancy (Foundation, Intermediate and Final under the 2023 scheme). CA papers test application, so pages need standard-referenced precision — the exact Ind AS, Standard on Auditing, or section of the Companies Act or Income-tax Act — plus worked reasoning rather than bare conclusions. Never state a rate, slab or threshold amount; explain how the threshold operates instead.",
    subjects: [CA_ACCOUNTING, CA_AUDIT, CA_TAXATION, CA_LAW_STRATEGY],
  },
  {
    studyGoal: "NEET_PG",
    label: "NEET PG",
    examContext:
      "NEET PG entrance for MD/MS admission. Readers are MBBS graduates. The paper is single-best-answer MCQs weighted towards clinical application, high-yield recall and image-based questions. Write in a high-yield revision register: mechanism first, then the discriminating clinical or laboratory feature, then the classic exam trap. Use standard textbook terminology and avoid stating numeric cut-offs or drug doses.",
    subjects: [
      NEETPG_PRECLINICAL,
      NEETPG_MEDICINE,
      NEETPG_CLINICAL,
      NEETPG_COMMUNITY_STRATEGY,
    ],
  },
  {
    studyGoal: "GATE",
    label: "GATE",
    examContext:
      "Graduate Aptitude Test in Engineering, with MCQ, MSQ and NAT questions and negative marking on MCQs only. The paper rewards derivation-level understanding plus fast numerical execution. Write as a concise engineering revision note: state the governing equation, define every symbol with its unit, derive only where the derivation is itself examinable, then work a numerical end to end and list the standard pitfalls.",
    subjects: [GATE_MATHEMATICS, GATE_CORE, GATE_APTITUDE_STRATEGY],
  },
  {
    studyGoal: "GENERAL",
    label: "General / study skills",
    examContext:
      "Learners preparing for any competitive or academic examination. Translate evidence-based study science into concrete routines. Name the underlying effect (testing effect, spacing effect, interleaving) and give a usable protocol rather than motivational advice.",
    subjects: [GENERAL_LEARNING, GENERAL_EXAM_CRAFT],
  },
];

export function blueprintForGoal(goal: StudyGoal): StarterPackBlueprint | null {
  return STARTER_PACK_BLUEPRINTS.find((b) => b.studyGoal === goal) ?? null;
}

function resolveSubject(subject: StarterSubject): ResolvedArticleSpec[] {
  return subject.topics.flatMap((topic) =>
    topic.articles.map((article) => ({
      ...article,
      subjectSlug: subject.slug,
      subjectName: subject.name,
      subjectDescription: subject.description,
      paper: subject.paper,
      topicSlug: topic.slug,
      topicTitle: topic.title,
    }))
  );
}

/** Flattens a blueprint into generation-ready specs, in subject → topic order. */
export function flattenBlueprint(
  blueprint: StarterPackBlueprint
): ResolvedArticleSpec[] {
  return blueprint.subjects.flatMap(resolveSubject);
}

export function specsForGoal(goal: StudyGoal): ResolvedArticleSpec[] {
  const blueprint = blueprintForGoal(goal);
  return blueprint ? flattenBlueprint(blueprint) : [];
}

/** Subject slugs owned by the generator — the preloaded catalog prune never sees these. */
export function generatedSubjectSlugs(): string[] {
  return [
    ...new Set([
      ...STARTER_PACK_BLUEPRINTS.flatMap((b) => b.subjects.map((s) => s.slug)),
      "upsc-csat",
    ]),
  ];
}
