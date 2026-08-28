import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  abortStudyStreamOnClientDisconnect,
  logStudyAiEmptyReply,
} from "./studyAiDiagnostics.js";

describe("studyAiDiagnostics", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs structured empty-reply fields", () => {
    logStudyAiEmptyReply({
      channel: "page_ask_stream",
      reason: "no_text_after_stream",
      userId: "u1",
      mode: "notes",
      depth: "quick",
      tokens: 0,
      aborted: false,
    });
    expect(console.error).toHaveBeenCalled();
    const line = String((console.error as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(line).toContain("study.ai.empty_reply");
    expect(line).toContain("no_text_after_stream");
    expect(line).toContain("notes");
  });

  it("aborts only when the response did not finish", () => {
    const abort = new AbortController();
    const spy = vi.spyOn(abort, "abort");
    const handlers: Record<string, () => void> = {};
    const res = {
      writableFinished: false,
      on: (ev: string, fn: () => void) => {
        handlers[ev] = fn;
      },
    };
    abortStudyStreamOnClientDisconnect(res, abort);
    handlers.close?.();
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockClear();
    res.writableFinished = true;
    handlers.close?.();
    expect(spy).not.toHaveBeenCalled();
  });
});
