import type { StudyGoal } from "@/types";
import { normalizeStudyGoal } from "@/lib/studyGoal";

export const PYQ_ALL_SUBJECTS = "All subjects";

export type PyqSelectOption = { value: string; label: string };

/** Paper / subject choices for previous-year practice, keyed by study goal. */
const PYQ_SUBJECTS: Record<StudyGoal, string[]> = {
  UPSC: [
    "Indian Polity & Constitution",
    "Indian Economy",
    "History & Indian Heritage",
    "Geography",
    "Environment & Ecology",
    "Indian Society & Social Justice",
    "International Relations",
    "Science, Technology & Internal Security",
    "Ethics, Integrity & Aptitude",
    "CSAT",
    "Essay",
  ],
  STATE_PCS: [
    "Polity & Public Administration",
    "Economy & Development",
    "History & Culture",
    "Geography",
    "State-specific General Studies",
    "Aptitude / CSAT",
  ],
  JUDICIARY: [
    "Civil Law",
    "Criminal Law & Procedure",
    "Evidence",
    "Constitutional Law",
    "Local laws",
    "Judgment writing",
  ],
  CA: [
    "Accounting & Financial Reporting",
    "Auditing & Assurance",
    "Taxation",
    "Corporate & Other Laws",
    "Financial Management",
    "Cost & Management Accounting",
  ],
  NEET_PG: [
    "Pre & Para-clinical Sciences",
    "Medicine & Allied",
    "Surgery, Obstetrics & Paediatrics",
    "Community Medicine",
    "Anatomy",
    "Physiology",
    "Pathology",
    "Pharmacology",
  ],
  GATE: [
    "Computer Science & IT",
    "Electronics & Communication",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Instrumentation Engineering",
    "Engineering Mathematics",
    "General Aptitude",
  ],
  GENERAL: [
    "General studies",
    "Quantitative aptitude",
    "Verbal ability",
    "Logical reasoning",
    "Domain / subject notes",
  ],
};

const PYQ_YEARS: Record<StudyGoal, string[]> = {
  UPSC: [
    "Last 5 available years",
    "Last 10 available years",
    "2015–2025",
    "All available years",
  ],
  STATE_PCS: [
    "Last 5 available years",
    "Last 10 available years",
    "2015–2025",
    "All available years",
  ],
  JUDICIARY: [
    "Last 5 available years",
    "Last 10 available years",
    "All available years",
  ],
  CA: [
    "Last 5 attempt cycles",
    "Last 10 attempt cycles",
    "All available years",
  ],
  NEET_PG: [
    "Last 5 available years",
    "Last 10 available years",
    "2015–2025",
    "All available years",
  ],
  GATE: [
    "Last 5 available years",
    "2020–2025",
    "2015–2025",
    "All available years",
  ],
  GENERAL: [
    "Last 5 available years",
    "2020–2025",
    "All available years",
  ],
};

function toOptions(values: string[]): PyqSelectOption[] {
  return values.map((value) => ({ value, label: value }));
}

export function pyqSubjectsForGoal(
  goal: StudyGoal | null | undefined
): PyqSelectOption[] {
  const subjects = PYQ_SUBJECTS[normalizeStudyGoal(goal)];
  return [{ value: PYQ_ALL_SUBJECTS, label: "All subjects" }, ...toOptions(subjects)];
}

export function pyqYearsForGoal(
  goal: StudyGoal | null | undefined
): PyqSelectOption[] {
  return toOptions(PYQ_YEARS[normalizeStudyGoal(goal)]);
}

export function defaultPyqPaper(goal: StudyGoal | null | undefined): string {
  return PYQ_ALL_SUBJECTS;
}

export function defaultPyqYears(goal: StudyGoal | null | undefined): string {
  return pyqYearsForGoal(goal)[0]?.value ?? "Last 5 available years";
}

/** Keep a prior selection only if it is still valid for this goal. */
export function coercePyqPaper(
  goal: StudyGoal | null | undefined,
  paper: string
): string {
  const opts = pyqSubjectsForGoal(goal);
  return opts.some((o) => o.value === paper) ? paper : defaultPyqPaper(goal);
}

export function coercePyqYears(
  goal: StudyGoal | null | undefined,
  years: string
): string {
  const opts = pyqYearsForGoal(goal);
  return opts.some((o) => o.value === years) ? years : defaultPyqYears(goal);
}
