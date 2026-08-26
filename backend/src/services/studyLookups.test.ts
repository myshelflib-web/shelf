import { describe, expect, it } from "vitest";
import { currentTimeLookup, fetchPublicUrl } from "./studyLookups.js";

describe("studyLookups", () => {
  it("returns UTC time for planner-relative questions", () => {
    const result = currentTimeLookup();
    expect(result.text).toMatch(/UTC now: \d{4}-\d{2}-\d{2}T/);
    expect(result.text).toContain("Use this to interpret relative planner dates");
  });

  it("rejects private or non-http URLs", async () => {
    await expect(fetchPublicUrl({ url: "http://127.0.0.1/secret" })).resolves.toEqual(
      { text: "fetch_url needs a public http(s) URL." }
    );
    await expect(fetchPublicUrl({ url: "ftp://example.com/x" })).resolves.toEqual(
      { text: "fetch_url needs a public http(s) URL." }
    );
    await expect(fetchPublicUrl({ url: "" })).resolves.toEqual({
      text: "fetch_url needs a public http(s) URL.",
    });
  });
});
