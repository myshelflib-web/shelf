import { describe, expect, it } from "vitest";
import { shouldCloseToolPopover } from "./ToolPopover";

describe("shouldCloseToolPopover", () => {
  it("closes when the click is outside the panel and anchor", () => {
    expect(shouldCloseToolPopover({} as EventTarget, null, null)).toBe(true);
  });

  it("stays open when the target is inside the panel", () => {
    const target = {} as EventTarget;
    const panel = {
      contains: (node: Node) => node === (target as Node),
    } as Node;
    expect(shouldCloseToolPopover(target, panel, null)).toBe(false);
  });

  it("stays open when the target is the anchor button", () => {
    const target = {} as EventTarget;
    const anchor = {
      contains: (node: Node) => node === (target as Node),
    } as Node;
    expect(shouldCloseToolPopover(target, null, anchor)).toBe(false);
  });
});
