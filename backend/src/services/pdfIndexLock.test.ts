import { describe, expect, it } from "vitest";
import { withPdfIndexLock } from "./pdfIndexLock.js";

describe("withPdfIndexLock", () => {
  it("runs tasks one after another", async () => {
    const order: number[] = [];
    await Promise.all([
      withPdfIndexLock(async () => {
        await new Promise((r) => setTimeout(r, 20));
        order.push(1);
      }),
      withPdfIndexLock(async () => {
        order.push(2);
      }),
    ]);
    expect(order).toEqual([1, 2]);
  });
});
