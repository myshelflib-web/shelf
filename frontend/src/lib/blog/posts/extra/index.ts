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
import { vsNotebooklm } from "./vs-notebooklm";
import { vsChatpdf } from "./vs-chatpdf";
import { vsNotionAi } from "./vs-notion-ai";
import { vsObsidian } from "./vs-obsidian";
import { vsAlternativesFeaturesPricing } from "./vs-alternatives-features-pricing";
import { storeNotesPdfsAskLlm } from "./store-notes-pdfs-ask-llm";
import { allInOneStudyWorkspace } from "./all-in-one-study-workspace";
import { teacherToolPrepareTests } from "./teacher-tool-prepare-tests";
import { studentStudyToolAskLlm } from "./student-study-tool-ask-llm";
import { darkModeFocus } from "./dark-mode-focus";
import { pinContinue } from "./pin-continue";
import { languageLearning } from "./language-learning";
import { nonfictionBooks } from "./nonfiction-books";
import { searchLibrary } from "./search-library";

/** Audience + workflow guides (multi-purpose Shelf). */
export const EXTRA_BLOG_POSTS: BlogPost[] = [
  vsAlternativesFeaturesPricing,
  allInOneStudyWorkspace,
  teacherToolPrepareTests,
  studentStudyToolAskLlm,
  storeNotesPdfsAskLlm,
  vsNotebooklm,
  vsChatpdf,
  vsNotionAi,
  vsObsidian,
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
