import { describe, expect, it } from "vitest";
import {
  hashSeed,
  pickFromPool,
  pickGuestNickname,
  pickSalutation,
  pickSurfaceLine,
  timeBucket,
} from "./livelyCopy";

describe("livelyCopy", () => {
  it("maps hours to time buckets", () => {
    expect(timeBucket(8)).toBe("morning");
    expect(timeBucket(14)).toBe("afternoon");
    expect(timeBucket(21)).toBe("evening");
  });

  it("picks stably for the same seed", () => {
    const a = pickSalutation({
      hour: 9,
      day: "2026-8-22",
      sessionSeed: "abc",
      slot: 10,
    });
    const b = pickSalutation({
      hour: 9,
      day: "2026-8-22",
      sessionSeed: "abc",
      slot: 10,
    });
    expect(a).toBe(b);
  });

  it("changes salutation when the slot advances", () => {
    const pool = new Set(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((slot) =>
        pickSalutation({
          hour: 9,
          day: "2026-8-22",
          sessionSeed: "abc",
          slot,
        })
      )
    );
    expect(pool.size).toBeGreaterThan(1);
  });

  it("advances surface lines when the slot advances", () => {
    const a = pickSurfaceLine("dashboard", {
      day: "2026-8-22",
      sessionSeed: "s",
      slot: 3,
      hour: 9,
    });
    const b = pickSurfaceLine("dashboard", {
      day: "2026-8-22",
      sessionSeed: "s",
      slot: 4,
      hour: 9,
    });
    expect(a).not.toBe(b);
  });

  it("varies surface lines by surface", () => {
    const library = pickSurfaceLine("library", {
      day: "2026-8-22",
      sessionSeed: "s",
      slot: 3,
    });
    const planner = pickSurfaceLine("planner", {
      day: "2026-8-22",
      sessionSeed: "s",
      slot: 3,
    });
    expect(library).not.toBe(planner);
  });

  it("hashes and indexes pools safely", () => {
    expect(pickFromPool(["a", "b", "c"], hashSeed("x"))).toMatch(/^[abc]$/);
  });

  it("picks a guest nickname from the rotating pool", () => {
    const nick = pickGuestNickname({
      day: "2026-8-22",
      sessionSeed: "abc",
      slot: 2,
    });
    expect(nick).toMatch(/^(stranger|wanderer|visitor|friend|newcomer|guest)$/);
    expect(
      pickGuestNickname({
        day: "2026-8-22",
        sessionSeed: "abc",
        slot: 2,
      })
    ).toBe(nick);
  });
});
