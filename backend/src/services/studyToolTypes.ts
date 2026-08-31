import type { StudyGoal } from "@prisma/client";
import type { Excerpt } from "./ragRetrieve.js";
import type { LibraryCitation } from "../utils/ragPack.js";

export type StudyToolContext = {
  userId: string;
  pageIds?: string[] | null;
  /** When set (reader page-ask), create_quiz defaults to this PAGE scope. */
  defaultPageId?: string | null;
  /** When false, web_search and fetch_url are rejected (reader default). */
  webSearch?: boolean;
  /** Learner track — biases web_search toward exam-specific sites. */
  studyGoal?: StudyGoal | null;
};

export type StudyToolResult = {
  text: string;
  excerpts?: Excerpt[];
  citations?: LibraryCitation[];
};
