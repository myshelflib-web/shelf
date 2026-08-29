export type QuizSourceKind = "LIBRARY" | "UPLOAD" | "EXAM_BANK";
export type QuizDifficulty = "EASY" | "MEDIUM" | "HARD" | "EXAM";
export type QuizQuestionType = "MCQ" | "WRITTEN" | "IMAGE";
export type QuizStatus =
  | "GENERATING"
  | "READY"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "GRADED"
  | "FAILED";

export type QuizMcqOption = { id: string; text: string };

export type QuizQuestion = {
  id: string;
  order: number;
  type: QuizQuestionType;
  prompt: string;
  options: QuizMcqOption[] | null;
  marks: number;
  syllabusHeading: string | null;
  sourceTag: string | null;
  userAnswerText: string | null;
  userAnswerOption: string | null;
  userImageUrl: string | null;
  correctOptionId?: string | null;
  modelAnswer?: string | null;
  explanation?: string | null;
  gradedScore?: number | null;
  gradedFeedback?: string | null;
};

export type QuizScore = {
  earned: number;
  max: number;
  percent: number;
};

export type QuizEndedReason = "SUBMIT" | "TAB" | "FULLSCREEN" | "TIMER";

export type Quiz = {
  id: string;
  title: string;
  sourceKind: QuizSourceKind;
  contextKind: string;
  contextNotebookId: string | null;
  contextTopicId: string | null;
  contextPageId: string | null;
  relevancyDocId: string | null;
  sourceLabel: string | null;
  focusTopic: string | null;
  difficulty: QuizDifficulty;
  timeLimitSec: number | null;
  mcqCount: number;
  writtenCount: number;
  proctored: boolean;
  endedReason: QuizEndedReason | null;
  status: QuizStatus;
  startedAt: string | null;
  submittedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  remainingSec: number | null;
  questions: QuizQuestion[];
  score?: QuizScore | null;
};

export type QuizSummary = {
  id: string;
  title: string;
  sourceKind: QuizSourceKind;
  sourceLabel: string | null;
  difficulty: QuizDifficulty;
  status: QuizStatus;
  mcqCount: number;
  writtenCount: number;
  timeLimitSec: number | null;
  proctored: boolean;
  endedReason: QuizEndedReason | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  score?: QuizScore | null;
};

export type QuizLaunch = {
  source?: QuizSourceKind | string;
  contextKind?: string;
  notebookId?: string | null;
  topicId?: string | null;
  pageId?: string | null;
  relevancyDocId?: string | null;
  focus?: string | null;
};
