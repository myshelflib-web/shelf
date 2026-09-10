import { describe, expect, it } from "vitest";
import {
  clearOptimisticOpenSeeds,
  peekOptimisticOpenSeed,
  setOptimisticOpenSeed,
  takeOptimisticOpenSeed,
} from "./optimisticOpenSeed";

describe("optimisticOpenSeed", () => {
  it("stores and takes by href or pageId", () => {
    clearOptimisticOpenSeeds();
    setOptimisticOpenSeed({
      pageId: "p1",
      href: "/my-content/file/notes",
      contentType: "HTML",
      content: "<p>hi</p>",
    });
    expect(
      peekOptimisticOpenSeed({ href: "/my-content/file/notes" })?.pageId
    ).toBe("p1");
    expect(takeOptimisticOpenSeed({ pageId: "p1" })?.content).toBe("<p>hi</p>");
    expect(peekOptimisticOpenSeed({ pageId: "p1" })).toBeNull();
  });
});
