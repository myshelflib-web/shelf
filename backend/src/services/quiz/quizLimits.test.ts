import { describe, expect, it } from "vitest";
import { parseEndedReason, parseProctored } from "./quizLimits.js";

describe("parseProctored", () => {
  it("defaults to true", () => {
    expect(parseProctored(undefined)).toBe(true);
    expect(parseProctored("")).toBe(true);
    expect(parseProctored("true")).toBe(true);
  });

  it("accepts explicit false from JSON and forms", () => {
    expect(parseProctored(false)).toBe(false);
    expect(parseProctored("false")).toBe(false);
    expect(parseProctored("0")).toBe(false);
    expect(parseProctored("no")).toBe(false);
  });
});

describe("parseEndedReason", () => {
  it("whitelists known reasons", () => {
    expect(parseEndedReason("TAB")).toBe("TAB");
    expect(parseEndedReason("fullscreen")).toBe("FULLSCREEN");
    expect(parseEndedReason("TIMER")).toBe("TIMER");
  });

  it("falls back to SUBMIT", () => {
    expect(parseEndedReason(undefined)).toBe("SUBMIT");
    expect(parseEndedReason("nope")).toBe("SUBMIT");
  });
});
