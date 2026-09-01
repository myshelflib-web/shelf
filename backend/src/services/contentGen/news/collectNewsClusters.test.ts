import { describe, expect, it } from "vitest";
import { clusterNewsItems } from "./collectNewsClusters.js";
import type { NewsSourceItem } from "./newsTypes.js";

function item(
  id: string,
  title: string,
  sourceName: string
): NewsSourceItem {
  return {
    id,
    title,
    canonicalUrl: `https://example.com/${id}`,
    sourceName,
    publishedAt: null,
    summary: "",
    excerpt: "",
    tags: [],
  };
}

describe("clusterNewsItems", () => {
  it("groups the same story reported by different publishers", () => {
    const clusters = clusterNewsItems([
      item("1", "Cabinet approves semiconductor fabrication plant in Gujarat", "PIB"),
      item("2", "Semiconductor fabrication plant approved for Gujarat by cabinet", "PRS"),
      item("3", "Supreme Court rules on electoral bonds disclosure", "SCI"),
    ]);

    const semiconductor = clusters.find((c) => c.items.length === 2);
    expect(semiconductor?.sourceCount).toBe(2);
    expect(clusters).toHaveLength(2);
  });

  it("ranks multi-source clusters first", () => {
    const clusters = clusterNewsItems([
      item("1", "Reserve Bank keeps repo rate unchanged", "PIB"),
      item("2", "Isolated coverage of an unrelated tribunal verdict", "DD"),
      item("3", "Repo rate unchanged says Reserve Bank policy panel", "PRS"),
    ]);

    expect(clusters[0].sourceCount).toBe(2);
  });

  it("does not merge unrelated stories", () => {
    const clusters = clusterNewsItems([
      item("1", "Parliament passes telecom amendment bill", "PIB"),
      item("2", "Monsoon withdrawal begins over Rajasthan", "IMD"),
    ]);

    expect(clusters).toHaveLength(2);
    expect(clusters.every((c) => c.sourceCount === 1)).toBe(true);
  });

  it("caps how many items land in one cluster", () => {
    const items = Array.from({ length: 8 }, (_, i) =>
      item(String(i), "Cabinet approves semiconductor fabrication plant", `Source ${i}`)
    );
    const clusters = clusterNewsItems(items, { maxPerCluster: 3 });
    expect(clusters.every((c) => c.items.length <= 3)).toBe(true);
  });
});
