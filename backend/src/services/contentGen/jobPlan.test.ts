import { describe, expect, it } from "vitest";
import { asNewsPlan, asStarterPlan, uniqueStarterEntries } from "./jobPlan.js";

describe("jobPlan", () => {
  it("accepts a compact starter plan and rejects junk", () => {
    const plan = asStarterPlan({
      v: 1,
      kind: "STARTER_PACK",
      entries: [{ subjectSlug: "upsc-polity", topicSlug: "parliament", slug: "ls", title: "Lok Sabha" }],
    });
    expect(plan?.entries).toHaveLength(1);
    expect(asStarterPlan(null)).toBeNull();
    expect(asStarterPlan({ kind: "NEWS_BRIEF", clusters: [] })).toBeNull();
  });

  it("dedupes failed rows into a compact starter plan", () => {
    const entries = uniqueStarterEntries([
      { title: "A", slug: "a", subjectSlug: "ca-acc", topicSlug: "ind-as" },
      { title: "A again", slug: "a", subjectSlug: "ca-acc", topicSlug: "ind-as" },
      { title: "B", slug: "b", subjectSlug: "ca-acc", topicSlug: "ind-as" },
    ]);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.slug).toBe("a");
    expect(entries[1]?.slug).toBe("b");
  });

  it("accepts a news plan", () => {
    const plan = asNewsPlan({
      v: 1,
      kind: "NEWS_BRIEF",
      topicSlug: "2026-09",
      topicTitle: "September 2026",
      clusters: [],
    });
    expect(plan?.topicSlug).toBe("2026-09");
    expect(asNewsPlan({ kind: "STARTER_PACK", entries: [] })).toBeNull();
  });
});
