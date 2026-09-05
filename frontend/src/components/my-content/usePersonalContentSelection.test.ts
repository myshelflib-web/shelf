import { describe, expect, it } from "vitest";
import { isHtmlSelectionChromeTarget } from "./usePersonalContentSelection";

describe("isHtmlSelectionChromeTarget", () => {
  it("ignores the color menu and tool popover", () => {
    expect(
      isHtmlSelectionChromeTarget({
        closest: (s: string) => (s.includes("highlight-menu") ? {} : null),
      } as unknown as EventTarget)
    ).toBe(true);
    expect(
      isHtmlSelectionChromeTarget({
        closest: (s: string) =>
          s.includes("data-shelf-tool-popover") ? {} : null,
      } as unknown as EventTarget)
    ).toBe(true);
  });

  it("treats the article as a real selection target", () => {
    expect(
      isHtmlSelectionChromeTarget({
        closest: () => null,
      } as unknown as EventTarget)
    ).toBe(false);
  });
});
