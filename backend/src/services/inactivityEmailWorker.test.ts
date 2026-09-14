import { describe, expect, it } from "vitest";
import { isInactivityEmailCandidate } from "./inactivityEmailWorker.js";

describe("isInactivityEmailCandidate", () => {
  it("accepts real student emails", () => {
    expect(isInactivityEmailCandidate("learner@gmail.com")).toBe(true);
  });

  it("skips telegram placeholders and local tour accounts", () => {
    expect(isInactivityEmailCandidate("tg_1@telegram.shelf.local")).toBe(false);
    expect(isInactivityEmailCandidate("tour@shelf.local")).toBe(false);
    expect(isInactivityEmailCandidate("admin@shelf.local")).toBe(false);
  });
});
