import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserSubject } from "@/types";

const getSubject = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    myContent: {
      getSubject: (...args: unknown[]) => getSubject(...args),
    },
  },
}));

import { ensureSubjectsForPageMove } from "./explorerMovePrepare";

const stub: UserSubject = {
  id: "s1",
  name: "Math",
  slug: "math",
  icon: "📁",
  order: 1,
  topicGroups: [],
  pages: [],
};

describe("ensureSubjectsForPageMove", () => {
  beforeEach(() => {
    getSubject.mockReset();
  });

  it("fetches a full subject when the destination topic is missing", async () => {
    getSubject.mockResolvedValue({
      subject: {
        ...stub,
        topicGroups: [
          {
            id: "g1",
            title: "Algebra",
            slug: "algebra",
            order: 1,
            pages: [],
          },
        ],
      },
    });

    const result = await ensureSubjectsForPageMove([stub], "s1", "g1");
    expect(getSubject).toHaveBeenCalledWith("math");
    expect(result.hydrated).toHaveLength(1);
    expect(result.subjects[0].topicGroups?.[0].id).toBe("g1");
  });

  it("skips fetch when moving to collection root", async () => {
    const result = await ensureSubjectsForPageMove([stub], "s1", null);
    expect(getSubject).not.toHaveBeenCalled();
    expect(result.hydrated).toHaveLength(0);
  });
});
