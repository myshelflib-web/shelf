import { describe, expect, it } from "vitest";
import {
  chatContextLabel,
  normalizeContextKind,
} from "./studyAiContextLabel";
import type { UserSubject } from "@/types";

const notebooks: UserSubject[] = [
  {
    id: "nb1",
    name: "Polity",
    slug: "polity",
    icon: "📁",
    order: 0,
    pages: [{ id: "p0", title: "Preamble", slug: "preamble", status: "PUBLISHED", order: 1 }],
    topicGroups: [
      {
        id: "tg1",
        title: "Fundamental Rights",
        slug: "fr",
        order: 1,
        pages: [
          {
            id: "p1",
            title: "Article 14",
            slug: "art-14",
            status: "PUBLISHED",
            order: 1,
          },
        ],
      },
    ],
  },
];

describe("studyAiContextLabel", () => {
  it("normalizes unknown kinds to LIBRARY", () => {
    expect(normalizeContextKind(undefined)).toBe("LIBRARY");
    expect(normalizeContextKind("page")).toBe("PAGE");
  });

  it("labels library / notebook / topic / page", () => {
    expect(
      chatContextLabel({ contextKind: "LIBRARY" }, notebooks)
    ).toBe("All library");
    expect(
      chatContextLabel(
        { contextKind: "NOTEBOOK", contextNotebookId: "nb1" },
        notebooks
      )
    ).toBe("Polity");
    expect(
      chatContextLabel(
        {
          contextKind: "TOPIC",
          contextNotebookId: "nb1",
          contextTopicId: "tg1",
        },
        notebooks
      )
    ).toBe("Polity · Fundamental Rights");
    expect(
      chatContextLabel(
        {
          contextKind: "PAGE",
          contextNotebookId: "nb1",
          contextTopicId: "tg1",
          contextPageId: "p1",
        },
        notebooks
      )
    ).toBe("Polity · Fundamental Rights · Article 14");
  });
});
