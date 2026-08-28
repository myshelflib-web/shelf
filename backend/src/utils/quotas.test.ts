import { describe, expect, it } from "vitest";
import {
  FREE_LLM_TOKENS,
  FREE_STORAGE_BYTES,
  LEGACY_FREE_STORAGE_BYTES,
  PREMIUM_STORAGE_BYTES,
  FREE_VECTOR_CHUNKS,
  PREMIUM_VECTOR_CHUNKS,
  assertLlmRoom,
  assertStorageRoom,
  chatMessageLimit,
  estimateTokens,
  llmTokenLimit,
  storageLimitBytes,
  vectorChunkLimit,
} from "./quotas.js";

const NEW_FREE_CREATED_AT = new Date("2026-09-01T00:00:00.000Z");
const LEGACY_FREE_CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

describe("quotas", () => {
  it("gives new free users 100 MB", () => {
    expect(
      storageLimitBytes({
        plan: "FREE",
        role: "STUDENT",
        createdAt: NEW_FREE_CREATED_AT,
      })
    ).toBe(FREE_STORAGE_BYTES);
  });

  it("keeps 250 MB for free users created before the cap change", () => {
    expect(
      storageLimitBytes({
        plan: "FREE",
        role: "STUDENT",
        createdAt: LEGACY_FREE_CREATED_AT,
      })
    ).toBe(LEGACY_FREE_STORAGE_BYTES);
  });

  it("keeps 250 MB when createdAt is missing so existing accounts stay grandfathered", () => {
    expect(
      storageLimitBytes({ plan: "FREE", role: "STUDENT" })
    ).toBe(LEGACY_FREE_STORAGE_BYTES);
  });

  it("gives premium users more storage", () => {
    expect(
      storageLimitBytes({ plan: "PREMIUM", role: "STUDENT" })
    ).toBe(PREMIUM_STORAGE_BYTES);
  });

  it("rejects uploads past the new free cap", () => {
    expect(() =>
      assertStorageRoom(
        {
          plan: "FREE",
          role: "STUDENT",
          createdAt: NEW_FREE_CREATED_AT,
          storageUsedBytes: FREE_STORAGE_BYTES,
        },
        1
      )
    ).toThrow(/Storage limit/);
  });

  it("lets legacy free users use the previous 250 MB cap", () => {
    expect(() =>
      assertStorageRoom(
        {
          plan: "FREE",
          role: "STUDENT",
          createdAt: LEGACY_FREE_CREATED_AT,
          storageUsedBytes: FREE_STORAGE_BYTES,
        },
        1
      )
    ).not.toThrow();
    expect(() =>
      assertStorageRoom(
        {
          plan: "FREE",
          role: "STUDENT",
          createdAt: LEGACY_FREE_CREATED_AT,
          storageUsedBytes: LEGACY_FREE_STORAGE_BYTES,
        },
        1
      )
    ).toThrow(/Storage limit/);
  });

  it("rejects LLM when the monthly pool is exhausted", () => {
    expect(() =>
      assertLlmRoom(
        { plan: "FREE", role: "STUDENT", llmTokensUsed: FREE_LLM_TOKENS },
        1
      )
    ).toThrow(/token limit reached/);
  });

  it("does not pre-reject by estimated cost", () => {
    expect(() =>
      assertLlmRoom(
        { plan: "FREE", role: "STUDENT", llmTokensUsed: 49_000 },
        1
      )
    ).not.toThrow();
  });

  it("gives free users a 50k monthly Study AI pool", () => {
    expect(llmTokenLimit({ plan: "FREE", role: "STUDENT" })).toBe(50_000);
  });

  it("estimates tokens from length", () => {
    expect(estimateTokens("abcd")).toBe(1);
  });

  it("gives free users a vector chunk cap", () => {
    expect(vectorChunkLimit({ plan: "FREE", role: "STUDENT" })).toBe(
      FREE_VECTOR_CHUNKS
    );
  });

  it("gives premium users a higher vector chunk cap", () => {
    expect(vectorChunkLimit({ plan: "PREMIUM", role: "STUDENT" })).toBe(
      PREMIUM_VECTOR_CHUNKS
    );
  });

  it("caps chat memory by plan", () => {
    expect(chatMessageLimit({ plan: "FREE", role: "STUDENT" })).toBe(30);
    expect(chatMessageLimit({ plan: "PREMIUM", role: "STUDENT" })).toBe(300);
  });
});
