import type { StudyGoal } from "@prisma/client";
import type { ChatToolDef } from "./llmTypes.js";
import { webSourceHintForGoal, webSourceProfile } from "./webSourceProfiles.js";

export const FETCH_URL_TOOL: ChatToolDef = {
  type: "function",
  function: {
    name: "fetch_url",
    description:
      "Fetch readable text from a public https page after web_search. Do not fetch private or login URLs.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Public https URL." },
      },
      required: ["url"],
    },
  },
};

/** Predefined web_search schema — track-aware domain hints in the description. */
export function buildWebSearchTool(goal?: StudyGoal | null): ChatToolDef {
  const profile = webSourceProfile(goal);
  const trackExamples = profile.preferredDomains.slice(0, 5).join(", ");

  return {
    type: "function",
    function: {
      name: "web_search",
      description:
        `Search the full public web for any topic — general knowledge, how-tos, people, places, live facts, news, weather — plus ${profile.label} sites such as ${trackExamples}. Use whenever the library/PDF does not cover the question.`,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Standalone search query (no pronouns).",
          },
          sourceScope: {
            type: "string",
            enum: ["all", "track", "general"],
            description:
              "all (default): open web + track sites. track: exam sites (falls back to open web). general: full open web for any topic.",
          },
        },
        required: ["query"],
      },
    },
  };
}

export function webSearchToolHint(goal?: StudyGoal | null): string {
  const profile = webSourceProfile(goal);
  return `${webSourceHintForGoal(goal)} General examples: ${profile.generalDomains.slice(0, 4).join(", ")}.`;
}
