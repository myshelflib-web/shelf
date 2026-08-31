import { describe, expect, it } from "vitest";
import { STUDY_TOOLS } from "./studyTools.js";
import {
  studyToolsForRequest,
  WEB_STUDY_TOOL_NAMES,
} from "./studyToolFilter.js";

describe("studyToolFilter", () => {
  it("includes track-aware web tools when web search is allowed", () => {
    const tools = studyToolsForRequest({ webSearch: true, studyGoal: "UPSC" });
    const names = tools.map((t) => t.function.name);
    expect(names).toContain("web_search");
    expect(names).toContain("fetch_url");
    const web = tools.find((t) => t.function.name === "web_search");
    expect(web?.function.description).toMatch(/upsc|UPSC/i);
  });

  it("includes all non-web tools when web search is allowed", () => {
    expect(studyToolsForRequest({ webSearch: true })).toHaveLength(
      STUDY_TOOLS.length
    );
  });

  it("strips web tools when web search is off", () => {
    const tools = studyToolsForRequest({ webSearch: false });
    const names = tools.map((t) => t.function.name);
    for (const name of WEB_STUDY_TOOL_NAMES) {
      expect(names).not.toContain(name);
    }
    expect(names).toContain("library_search");
  });
});
