import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/consumeGuestLearnImport", () => ({
  consumeGuestLearnImport: vi.fn(async () => null),
}));

import { consumeGuestLearnImport } from "@/lib/consumeGuestLearnImport";
import {
  destinationAfterOnboarding,
  destinationAfterSignIn,
} from "./postAuthNavigation";

describe("postAuthNavigation", () => {
  beforeEach(() => {
    vi.mocked(consumeGuestLearnImport).mockResolvedValue(null);
  });

  it("prefers an imported personal page after sign-in", async () => {
    vi.mocked(consumeGuestLearnImport).mockResolvedValue(
      "/my-content/gate/file/syllabus"
    );
    await expect(destinationAfterSignIn("/learn")).resolves.toBe(
      "/my-content/gate/file/syllabus"
    );
  });

  it("sends a new exam-goal user to the library Preloaded tab", async () => {
    await expect(destinationAfterOnboarding("/learn", "GATE")).resolves.toBe(
      "/my-content"
    );
    await expect(
      destinationAfterOnboarding("/my-content", "UPSC")
    ).resolves.toBe("/my-content");
  });

  it("keeps a General new user on the requested next path", async () => {
    await expect(
      destinationAfterOnboarding("/my-content", "GENERAL")
    ).resolves.toBe("/my-content");
  });
});
