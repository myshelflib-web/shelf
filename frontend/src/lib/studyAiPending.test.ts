import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  stashStudyAiPending,
  takeStudyAiPending,
  hasStudyAiPending,
  STUDY_AI_NEW_THREAD,
} from "./studyAiPending";

describe("studyAiPending", () => {
  const mem = new Map<string, string>();

  beforeEach(() => {
    mem.clear();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a stashed prompt for the matching thread", () => {
    stashStudyAiPending("thread-1", "Quiz me", "data:image/png;base64,xx");
    expect(takeStudyAiPending("thread-2")).toBeNull();
    expect(takeStudyAiPending("thread-1")).toEqual({
      text: "Quiz me",
      imageBase64: "data:image/png;base64,xx",
    });
    expect(takeStudyAiPending("thread-1")).toBeNull();
  });

  it("holds a new-chat prompt until /study-ai takes it", () => {
    stashStudyAiPending(STUDY_AI_NEW_THREAD, "Quiz me");
    expect(hasStudyAiPending(STUDY_AI_NEW_THREAD)).toBe(true);
    expect(takeStudyAiPending("thread-1")).toBeNull();
    expect(takeStudyAiPending(STUDY_AI_NEW_THREAD)).toEqual({ text: "Quiz me" });
    expect(hasStudyAiPending(STUDY_AI_NEW_THREAD)).toBe(false);
  });
});
