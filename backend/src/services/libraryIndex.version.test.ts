import { describe, expect, it } from "vitest";
import { INDEX_CONTENT_VERSION } from "./libraryIndexText.js";

describe("INDEX_CONTENT_VERSION", () => {
  it("prefixes content hashes so the worker can detect outdated rows", () => {
    expect(INDEX_CONTENT_VERSION).toMatch(/^v\d+$/);
    const sample = `${INDEX_CONTENT_VERSION}:abcd1234efgh5678`;
    expect(sample.startsWith(`${INDEX_CONTENT_VERSION}:`)).toBe(true);
    expect("deadbeefdeadbeef".startsWith(`${INDEX_CONTENT_VERSION}:`)).toBe(false);
  });
});
