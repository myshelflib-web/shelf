import { describe, expect, it } from "vitest";
import { getLogContext, runWithLogContext } from "./logContext.js";

describe("logContext", () => {
  it("merges nested context", () => {
    runWithLogContext({ requestId: "req-1" }, () => {
      expect(getLogContext().requestId).toBe("req-1");
    });
  });

  it("does not leak context outside scope", () => {
    runWithLogContext({ requestId: "req-2" }, () => undefined);
    expect(getLogContext().requestId).toBeUndefined();
  });
});
