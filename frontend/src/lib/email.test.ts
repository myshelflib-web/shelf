import { describe, expect, it } from "vitest";
import { isValidEmailFormat } from "./email";

describe("isValidEmailFormat", () => {
  it("accepts typical addresses", () => {
    expect(isValidEmailFormat("user@gmail.com")).toBe(true);
    expect(isValidEmailFormat("  first.last+tag@college.edu  ")).toBe(true);
  });

  it("rejects incomplete or junk addresses", () => {
    expect(isValidEmailFormat("")).toBe(false);
    expect(isValidEmailFormat("not-an-email")).toBe(false);
    expect(isValidEmailFormat("user@gmail")).toBe(false);
    expect(isValidEmailFormat("user name@gmail.com")).toBe(false);
  });
});
