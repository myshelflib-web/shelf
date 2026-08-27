import { describe, expect, it } from "vitest";
import {
  STUDY_ACTION_TOOLS,
  actionToolStatusDetail,
} from "./studyActionTools.js";
import { STUDY_TOOLS, toolStatusDetail } from "./studyTools.js";

describe("study action tools", () => {
  it("registers write tools alongside lookups", () => {
    const names = STUDY_TOOLS.map((t) => t.function.name);
    expect(names).toContain("create_planner_item");
    expect(names).toContain("update_planner_item");
    expect(names).toContain("create_quiz");
    expect(names).toContain("lookup_planner");
    expect(STUDY_ACTION_TOOLS).toHaveLength(3);
  });

  it("exposes status copy for write tools", () => {
    expect(actionToolStatusDetail("create_planner_item")).toMatch(/planner/i);
    expect(toolStatusDetail("create_quiz")).toMatch(/quiz/i);
    expect(toolStatusDetail("library_search")).toMatch(/library/i);
  });
});
