import type { Excerpt } from "./ragRetrieve.js";
import type { LibraryCitation } from "../utils/ragPack.js";

export type StudyToolContext = {
  userId: string;
  pageIds?: string[] | null;
  /** When set (reader page-ask), create_quiz defaults to this PAGE scope. */
  defaultPageId?: string | null;
};

export type StudyToolResult = {
  text: string;
  excerpts?: Excerpt[];
  citations?: LibraryCitation[];
};
