import { describe, expect, it } from "vitest";
import {
  resolveFolderSyncVisual,
  resolveItemSyncVisual,
} from "./pendingPageSync";

describe("resolveItemSyncVisual", () => {
  it("prefers error over pending", () => {
    expect(
      resolveItemSyncVisual("a", new Set(["a"]), new Set(["a"]))
    ).toBe("error");
    expect(resolveItemSyncVisual("a", new Set(["a"]), new Set())).toBe(
      "pending"
    );
    expect(resolveItemSyncVisual("a", new Set(), new Set())).toBe("synced");
  });
});

describe("resolveFolderSyncVisual", () => {
  it("aggregates child page status", () => {
    expect(
      resolveFolderSyncVisual(["a", "b"], new Set(["b"]), new Set())
    ).toBe("pending");
    expect(
      resolveFolderSyncVisual(["a", "b"], new Set(["b"]), new Set(["a"]))
    ).toBe("error");
    expect(resolveFolderSyncVisual(["a"], new Set(), new Set())).toBe(
      "synced"
    );
  });

  it("honors folder entity keys", () => {
    expect(
      resolveFolderSyncVisual(
        [],
        new Set(),
        new Set(),
        "subject:s1",
        new Set(["subject:s1"]),
        new Set()
      )
    ).toBe("pending");
    expect(
      resolveFolderSyncVisual(
        [],
        new Set(),
        new Set(),
        "topic:t1",
        new Set(),
        new Set(["topic:t1"])
      )
    ).toBe("error");
  });
});
