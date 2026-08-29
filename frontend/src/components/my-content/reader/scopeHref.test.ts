import { describe, expect, it } from "vitest";
import {
  mergeReaderScope,
  scopeFromHref,
  scopeHref,
} from "./types";

describe("shared link scope", () => {
  it("keeps the link token in href and round-trips", () => {
    const href = "/my-content/shared/page-1?t=abc_token";
    const scope = scopeFromHref(href);
    expect(scope).toEqual({
      kind: "shared",
      pageId: "page-1",
      linkToken: "abc_token",
    });
    expect(scope && scopeHref(scope)).toBe(href);
  });

  it("merges a missing token from the route scope", () => {
    const merged = mergeReaderScope(
      { kind: "shared", pageId: "page-1" },
      { kind: "shared", pageId: "page-1", linkToken: "secret" }
    );
    expect(merged).toEqual({
      kind: "shared",
      pageId: "page-1",
      linkToken: "secret",
    });
  });
});
