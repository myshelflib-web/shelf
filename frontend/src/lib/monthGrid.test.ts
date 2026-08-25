import { describe, expect, it } from "vitest";
import { localYmd, monthCells } from "./monthGrid";

describe("monthGrid", () => {
  it("formats a local calendar day", () => {
    expect(localYmd(new Date(2026, 7, 22))).toBe("2026-08-22");
  });

  it("pads August 2026 from Saturday and fills 31 days", () => {
    const cells = monthCells(2026, 7);
    expect(cells[0]).toBeNull();
    expect(cells[6]).toBe(1);
    expect(cells.filter((d) => d != null)).toHaveLength(31);
    expect(cells.length % 7).toBe(0);
  });
});
