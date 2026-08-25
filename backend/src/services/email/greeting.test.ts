import { describe, expect, it } from "vitest";
import {
  getDisplayFirstName,
  getEmailGreetingParts,
  pickEmailSalutation,
  timeBucket,
} from "./greeting.js";

describe("email greeting", () => {
  it("picks time-based salutations", () => {
    expect(timeBucket(9)).toBe("morning");
    expect(timeBucket(14)).toBe("afternoon");
    expect(timeBucket(20)).toBe("evening");
    expect(pickEmailSalutation(9)).toMatch(/./);
  });

  it("uses first name only", () => {
    expect(getDisplayFirstName("Vishnu Mishra")).toBe("Vishnu");
    expect(getDisplayFirstName("")).toBe("there");
  });

  it("returns salutation, name, and subtitle", () => {
    const parts = getEmailGreetingParts("Ada Lovelace", 10);
    expect(parts.firstName).toBe("Ada");
    expect(parts.salutation.length).toBeGreaterThan(0);
    expect(parts.subtitle.length).toBeGreaterThan(0);
  });
});
