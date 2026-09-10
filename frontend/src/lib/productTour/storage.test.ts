import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isTourDone,
  isNewEnoughForProductTour,
  markTourDone,
  PRODUCT_TOUR_NEW_USER_MS,
  resetAllTours,
  resetTour,
  skipProductToursForLegacyUser,
  surfaceFromPathname,
  tourStorageKey,
} from "./storage";
import type { User } from "@/types";

const USER = "user-tour-test";

function userWithAge(ageMs: number | null): User {
  return {
    id: USER,
    email: "tour@test.com",
    name: "Tour",
    role: "STUDENT",
    plan: "FREE",
    createdAt:
      ageMs == null ? undefined : new Date(Date.now() - ageMs).toISOString(),
  } as User;
}

describe("productTour storage", () => {
  const mem = new Map<string, string>();

  beforeEach(() => {
    mem.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
      get length() {
        return mem.size;
      },
      key: (i: number) => [...mem.keys()][i] ?? null,
    });
    vi.stubGlobal("window", { localStorage: globalThis.localStorage });
  });

  afterEach(() => {
    resetAllTours(USER);
    vi.unstubAllGlobals();
  });

  it("marks a surface done and skipped", () => {
    expect(isTourDone("library", USER)).toBe(false);
    markTourDone("library", USER, "done");
    expect(isTourDone("library", USER)).toBe(true);
    expect(localStorage.getItem(tourStorageKey("library", USER))).toBe("done");

    resetTour("library", USER);
    expect(isTourDone("library", USER)).toBe(false);

    markTourDone("dashboard", USER, "skipped");
    expect(isTourDone("dashboard", USER)).toBe(true);
    expect(localStorage.getItem(tourStorageKey("dashboard", USER))).toBe(
      "skipped"
    );
  });

  it("resetAllTours clears every surface for the user", () => {
    markTourDone("library", USER);
    markTourDone("reader", USER, "skipped");
    resetAllTours(USER);
    expect(isTourDone("library", USER)).toBe(false);
    expect(isTourDone("reader", USER)).toBe(false);
  });

  it("only treats recent accounts as new enough for auto tours", () => {
    expect(isNewEnoughForProductTour(userWithAge(60_000))).toBe(true);
    expect(
      isNewEnoughForProductTour(userWithAge(PRODUCT_TOUR_NEW_USER_MS + 1))
    ).toBe(false);
    expect(isNewEnoughForProductTour(userWithAge(null))).toBe(false);
  });

  it("stamps all surfaces skipped for legacy accounts", () => {
    const legacy = userWithAge(PRODUCT_TOUR_NEW_USER_MS + 1);
    skipProductToursForLegacyUser(legacy);
    expect(isTourDone("library", USER)).toBe(true);
    expect(isTourDone("quiz", USER)).toBe(true);
  });
});

describe("surfaceFromPathname", () => {
  it("maps signed-in routes to tour surfaces", () => {
    expect(surfaceFromPathname("/dashboard")).toBe("dashboard");
    expect(surfaceFromPathname("/planner")).toBe("planner");
    expect(surfaceFromPathname("/calendar")).toBe("planner");
    expect(surfaceFromPathname("/study-ai")).toBe("study-ai");
    expect(surfaceFromPathname("/study-ai/abc")).toBe("study-ai");
    expect(surfaceFromPathname("/quiz")).toBe("quiz");
    expect(surfaceFromPathname("/quiz/")).toBe("quiz");
    expect(surfaceFromPathname("/quiz/abc")).toBe(null);
    expect(surfaceFromPathname("/my-content")).toBe("library");
    expect(surfaceFromPathname("/my-content/file/page-1")).toBe("reader");
    expect(surfaceFromPathname("/my-content/n1/file/page-1")).toBe("reader");
    expect(surfaceFromPathname("/my-content/n1/t1/page-1")).toBe("reader");
    expect(surfaceFromPathname("/my-content/n1")).toBe("library");
    expect(surfaceFromPathname("/settings")).toBe(null);
    expect(surfaceFromPathname("/login")).toBe(null);
  });
});
