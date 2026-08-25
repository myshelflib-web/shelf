import { describe, expect, it } from "vitest";
import { parseBytesRange } from "./byteRange.js";

describe("parseBytesRange", () => {
  it("parses closed ranges", () => {
    expect(parseBytesRange("bytes=0-99", 1000)).toEqual({ start: 0, end: 99 });
  });

  it("parses open-ended ranges", () => {
    expect(parseBytesRange("bytes=100-", 1000)).toEqual({
      start: 100,
      end: 999,
    });
  });

  it("parses suffix ranges", () => {
    expect(parseBytesRange("bytes=-50", 1000)).toEqual({
      start: 950,
      end: 999,
    });
  });

  it("clamps end to size-1", () => {
    expect(parseBytesRange("bytes=0-9999", 100)).toEqual({
      start: 0,
      end: 99,
    });
  });

  it("returns unsatisfiable when start past end", () => {
    expect(parseBytesRange("bytes=50-40", 100)).toBe("unsatisfiable");
    expect(parseBytesRange("bytes=100-", 100)).toBe("unsatisfiable");
  });

  it("returns null when header missing", () => {
    expect(parseBytesRange(undefined, 100)).toBeNull();
  });
});
