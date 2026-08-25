import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirstSubject = vi.fn();
const findFirstGroup = vi.fn();
const findFirstPage = vi.fn();
const findManyPages = vi.fn();

vi.mock("./prisma.js", () => ({
  default: {
    userSubject: { findFirst: (...a: unknown[]) => findFirstSubject(...a) },
    userTopicGroup: { findFirst: (...a: unknown[]) => findFirstGroup(...a) },
    userTopic: {
      findFirst: (...a: unknown[]) => findFirstPage(...a),
      findMany: (...a: unknown[]) => findManyPages(...a),
    },
  },
}));

describe("resolveContextPageIds", () => {
  beforeEach(() => {
    findFirstSubject.mockReset();
    findFirstGroup.mockReset();
    findFirstPage.mockReset();
    findManyPages.mockReset();
  });

  it("returns null pageIds for LIBRARY", async () => {
    const { resolveContextPageIds } = await import("./chatContext.js");
    const result = await resolveContextPageIds("u1", {
      contextKind: "LIBRARY",
      contextNotebookId: null,
      contextTopicId: null,
      contextPageId: null,
    });
    expect(result.pageIds).toBeNull();
    expect(result.label).toBe("All library");
  });

  it("resolves notebook page ids", async () => {
    findFirstSubject.mockResolvedValue({ id: "nb1", name: "History" });
    findManyPages.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    const { resolveContextPageIds } = await import("./chatContext.js");
    const result = await resolveContextPageIds("u1", {
      contextKind: "NOTEBOOK",
      contextNotebookId: "nb1",
      contextTopicId: null,
      contextPageId: null,
    });
    expect(result.kind).toBe("NOTEBOOK");
    expect(result.pageIds).toEqual(["a", "b"]);
    expect(result.label).toBe("History");
  });

  it("resolves a single page", async () => {
    findFirstPage.mockResolvedValue({
      id: "p1",
      title: "Art 21",
      userSubject: { name: "Polity" },
      userTopicGroup: { title: "Rights" },
    });
    const { resolveContextPageIds } = await import("./chatContext.js");
    const result = await resolveContextPageIds("u1", {
      contextKind: "PAGE",
      contextNotebookId: "nb1",
      contextTopicId: "tg1",
      contextPageId: "p1",
    });
    expect(result.pageIds).toEqual(["p1"]);
    expect(result.label).toBe("Polity · Rights · Art 21");
  });
});
