import { describe, expect, it } from "vitest";
import { sameHostname, statusFromHttp } from "./publicLinkCheck.js";

describe("publicLinkCheck", () => {
  it("marks 404 as BROKEN", () => {
    expect(statusFromHttp(404, true)).toBe("BROKEN");
  });

  it("marks blocked embed as BLOCKED_EMBED", () => {
    expect(statusFromHttp(200, false)).toBe("BLOCKED_EMBED");
  });

  it("marks healthy embeddable URLs as OK", () => {
    expect(statusFromHttp(200, true)).toBe("OK");
  });

  it("compares hostnames for redirect updates", () => {
    expect(
      sameHostname("https://ncert.nic.in/old", "https://ncert.nic.in/new")
    ).toBe(true);
    expect(
      sameHostname("https://ncert.nic.in/", "https://example.com/")
    ).toBe(false);
  });
});
