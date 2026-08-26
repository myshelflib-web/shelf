import { describe, expect, it } from "vitest";
import {
  filterCommands,
  isSlashMenuQuery,
  parseSlashInput,
  resolveStudyAiInput,
} from "./studyAiCommands";

describe("studyAiCommands", () => {
  it("parses slash + args", () => {
    expect(parseSlashInput("/quiz federalism")).toEqual({
      slash: "quiz",
      args: "federalism",
    });
    expect(parseSlashInput("plain")).toBeNull();
  });

  it("opens the menu on a bare slash token", () => {
    expect(isSlashMenuQuery("/")).toBe(true);
    expect(isSlashMenuQuery("/quiz")).toBe(true);
    expect(isSlashMenuQuery("/quiz polity")).toBe(false);
  });

  it("filters commands by name", () => {
    const hits = filterCommands("/pyq");
    expect(hits.some((c) => c.slash === "pyq")).toBe(true);
  });

  it("resolves page modes and library prompts", () => {
    expect(resolveStudyAiInput("/summarize", "page")).toEqual({
      kind: "mode",
      mode: "summarize",
    });
    expect(resolveStudyAiInput("/help", "library")).toEqual({ kind: "help" });
    const quiz = resolveStudyAiInput("/quiz", "library");
    expect(quiz.kind).toBe("prompt");
    if (quiz.kind === "prompt") {
      expect(quiz.text.toLowerCase()).toContain("quiz");
    }
  });
});
