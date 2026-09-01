import { describe, expect, it } from "vitest";
import { ALL_PRELOADED_CATALOG } from "./catalogIndex.js";

describe("preloaded catalog", () => {
  it("does not seed mirrored PDFs or portal links into Learn", () => {
    expect(ALL_PRELOADED_CATALOG).toEqual([]);
  });
});
