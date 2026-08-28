import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuotaError } from "./quotas.js";

const findUnique = vi.fn();
const update = vi.fn();

vi.mock("./prisma.js", () => ({
  default: {
    user: {
      findUnique: (...a: unknown[]) => findUnique(...a),
      update: (...a: unknown[]) => update(...a),
    },
  },
}));

describe("llmUsage", () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
  });

  it("charges the monthly counter after refresh", async () => {
    findUnique.mockResolvedValue({
      id: "u1",
      plan: "FREE",
      role: "STUDENT",
      subscriptionExpiresAt: null,
      llmTokensUsed: 100,
      llmTokensResetAt: new Date(),
    });

    const { chargeLlmTokens } = await import("./llmUsage.js");
    await chargeLlmTokens("u1", 120);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: { llmTokensUsed: { increment: 120 } },
      })
    );
  });

  it("assertLlmBudget rejects when the monthly pool is exhausted", async () => {
    findUnique.mockResolvedValue({
      id: "u1",
      plan: "FREE",
      role: "STUDENT",
      subscriptionExpiresAt: null,
      llmTokensUsed: 50_000,
      llmTokensResetAt: new Date(),
    });

    const { assertLlmBudget } = await import("./llmUsage.js");
    await expect(assertLlmBudget("u1", 1)).rejects.toBeInstanceOf(QuotaError);
  });
});
