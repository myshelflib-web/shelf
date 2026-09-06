import { describe, expect, it } from "vitest";
import { readerLocationAfterPageMove } from "./pageMoveLocation";
import type { UserSubject } from "@/types";

const subjects: UserSubject[] = [
  {
    id: "s1",
    name: "Math",
    slug: "math",
    icon: "📁",
    order: 1,
    topicGroups: [
      {
        id: "g1",
        title: "Algebra",
        slug: "algebra",
        order: 1,
        pages: [],
      },
    ],
    pages: [],
  },
];

describe("readerLocationAfterPageMove", () => {
  it("builds a topic path", () => {
    const loc = readerLocationAfterPageMove(subjects, "s1", "g1", "one");
    expect(loc.href).toBe("/my-content/math/algebra/one");
    expect(loc.scope).toEqual({
      kind: "topic",
      notebookSlug: "math",
      topicSlug: "algebra",
      pageSlug: "one",
    });
  });

  it("builds a notebook file path", () => {
    const loc = readerLocationAfterPageMove(subjects, "s1", null, "one");
    expect(loc.href).toBe("/my-content/math/file/one");
  });

  it("builds a root file path", () => {
    const loc = readerLocationAfterPageMove(subjects, null, null, "one");
    expect(loc.href).toBe("/my-content/file/one");
  });
});
