import type { StudyGoal } from "@prisma/client";
import type { ChatToolDef } from "./llmTypes.js";
import { STUDY_TOOLS } from "./studyTools.js";
import {
  buildWebSearchTool,
  FETCH_URL_TOOL,
} from "./studyWebToolSchemas.js";

export const WEB_STUDY_TOOL_NAMES = new Set(["web_search", "fetch_url"]);

/** LLM tool schemas for a Study AI request (web tools optional, track-aware). */
export function studyToolsForRequest(opts?: {
  webSearch?: boolean;
  studyGoal?: StudyGoal | null;
}): ChatToolDef[] {
  const base = STUDY_TOOLS.filter(
    (t) => !WEB_STUDY_TOOL_NAMES.has(t.function.name)
  );
  if (opts?.webSearch === false) return base;
  return [...base, buildWebSearchTool(opts?.studyGoal), FETCH_URL_TOOL];
}
