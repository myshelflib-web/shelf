import { describe, expect, it } from "vitest";
import {
  diversifyExcerpts,
  mergeUniqueTexts,
  reciprocalRankFusion,
  spreadSample,
} from "./ragFusion.js";

function ex(
  pageId: string,
  text: string,
  score: number
): {
  pageId: string;
  title: string;
  notebook: string;
  topic: string;
  href: string;
  text: string;
  score: number;
} {
  return {
    pageId,
    title: pageId,
    notebook: "N",
    topic: "",
    href: "/",
    text,
    score,
  };
}

describe("reciprocalRankFusion", () => {
  it("boosts items that appear in both lists", () => {
    const vector = [ex("a", "alpha chunk", 0.9), ex("b", "beta chunk", 0.8)];
    const keyword = [ex("b", "beta chunk", 3), ex("c", "gamma chunk", 2)];
    const fused = reciprocalRankFusion([vector, keyword]);
    expect(fused[0].pageId).toBe("b");
    expect(fused.map((e) => e.pageId).sort()).toEqual(["a", "b", "c"]);
  });
});

describe("diversifyExcerpts", () => {
  it("caps chunks per page then fills from overflow", () => {
    const list = [
      ex("p1", "one", 1),
      ex("p1", "two", 0.9),
      ex("p1", "three", 0.8),
      ex("p2", "four", 0.7),
    ];
    const out = diversifyExcerpts(list, 3, 2);
    expect(out.filter((e) => e.pageId === "p1")).toHaveLength(2);
    expect(out.some((e) => e.pageId === "p2")).toBe(true);
  });
});

describe("spreadSample", () => {
  it("keeps ends and middle of a long list", () => {
    const items = Array.from({ length: 10 }, (_, i) => i);
    expect(spreadSample(items, 3)).toEqual([0, 5, 9]);
    expect(spreadSample(items, 20)).toEqual(items);
  });
});

describe("mergeUniqueTexts", () => {
  it("prefers question hits then fills from the rest of the file", () => {
    const out = mergeUniqueTexts(
      ["alpha passage"],
      ["alpha passage", "omega tail", "mid chapter"],
      3
    );
    expect(out[0]).toBe("alpha passage");
    expect(out).toContain("omega tail");
    expect(out).toHaveLength(3);
  });
});
