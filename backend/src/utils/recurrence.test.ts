import { describe, expect, it } from "vitest";
import { addPeriod, expandInRange, parseRecurrence } from "./recurrence.js";

describe("parseRecurrence", () => {
  it("accepts daily weekly monthly", () => {
    expect(parseRecurrence("WEEKLY")).toBe("WEEKLY");
  });

  it("falls back to NONE", () => {
    expect(parseRecurrence("nope")).toBe("NONE");
  });
});

describe("expandInRange", () => {
  it("leaves tasks as a single item", () => {
    const due = new Date("2026-08-03T10:00:00.000Z");
    const items = expandInRange(
      [
        {
          id: "t1",
          kind: "TASK",
          dueAt: due,
          endsAt: null,
          recurrence: "WEEKLY",
        },
      ],
      new Date("2026-08-01T00:00:00.000Z"),
      new Date("2026-08-31T00:00:00.000Z")
    );
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("t1");
  });

  it("expands weekly events across the window", () => {
    const due = new Date("2026-08-03T10:00:00.000Z");
    const items = expandInRange(
      [
        {
          id: "e1",
          kind: "EVENT",
          dueAt: due,
          endsAt: new Date("2026-08-03T11:00:00.000Z"),
          recurrence: "WEEKLY",
          recurUntil: null,
        },
      ],
      new Date("2026-08-01T00:00:00.000Z"),
      new Date("2026-08-31T00:00:00.000Z")
    );
    expect(items.length).toBeGreaterThan(3);
    expect(items[0].id).toBe("e1");
    expect(items[1].id).toMatch(/^e1::/);
    expect(items[1].seriesId).toBe("e1");
  });

  it("advances monthly", () => {
    const next = addPeriod(new Date("2026-01-15T00:00:00.000Z"), "MONTHLY");
    expect(next.getUTCMonth()).toBe(1);
  });
});
