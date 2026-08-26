import type { BlogPost } from "../../types";
import { gettingStarted } from "./getting-started";
import { uploadOrganize } from "./upload-organize";
import { collegeStudents } from "./college-students";
import { lawStudents } from "./law-students";
import { medicalScience } from "./medical-science";
import { researchPapers } from "./research-papers";
import { professionals } from "./professionals";
import { teachers } from "./teachers";
import { privacyLibrary } from "./privacy-library";
import { vsChatbots } from "./vs-chatbots";
import { darkModeFocus } from "./dark-mode-focus";
import { pinContinue } from "./pin-continue";
import { languageLearning } from "./language-learning";
import { nonfictionBooks } from "./nonfiction-books";
import { searchLibrary } from "./search-library";

/** Audience + workflow guides (multi-purpose Shelf). */
export const EXTRA_BLOG_POSTS: BlogPost[] = [
  searchLibrary,
  nonfictionBooks,
  languageLearning,
  pinContinue,
  darkModeFocus,
  vsChatbots,
  privacyLibrary,
  teachers,
  professionals,
  researchPapers,
  medicalScience,
  lawStudents,
  collegeStudents,
  uploadOrganize,
  gettingStarted,
];
