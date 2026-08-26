import { describe, expect, it } from "vitest";
import {
  filterCommands,
  isSlashMenuQuery,
  parseSlashInput,
  resolveStudyAiInput,
  studyAiSendParts,
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
      expect(quiz.display).toBe("/quiz");
    }
  });

  it("keeps bubble labels short for commands and chips", () => {
    const fromSlash = studyAiSendParts("/outline", "library");
    expect(fromSlash).toEqual({
      kind: "send",
      display: "/outline",
      prompt: expect.stringContaining("Outline an exam answer"),
    });
    const fromChip = studyAiSendParts("/outline", "library", {
      label: "Answer outline",
    });
    expect(fromChip.kind).toBe("send");
    if (fromChip.kind === "send") {
      expect(fromChip.display).toBe("Answer outline");
      expect(fromChip.prompt).toContain("Outline an exam answer");
    }
    const expanded = resolveStudyAiInput("/flashcards", "library");
    expect(expanded.kind).toBe("prompt");
    if (expanded.kind !== "prompt") return;
    const leaked = studyAiSendParts(expanded.text, "library");
    expect(leaked.kind).toBe("send");
    if (leaked.kind === "send") {
      expect(leaked.display).toBe("/flashcards");
    }
  });
});
