import { describe, expect, it } from "vitest";
import {
  FREE_STORAGE_BYTES,
  PREMIUM_STORAGE_BYTES,
  FREE_VECTOR_CHUNKS,
  PREMIUM_VECTOR_CHUNKS,
  assertLlmRoom,
  assertStorageRoom,
  chatMessageLimit,
  estimateTokens,
  storageLimitBytes,
  vectorChunkLimit,
} from "./quotas.js";

describe("quotas", () => {
  it("gives free users 250 MB", () => {
    expect(
      storageLimitBytes({ plan: "FREE", role: "STUDENT" })
    ).toBe(FREE_STORAGE_BYTES);
  });

  it("gives premium users more storage", () => {
    expect(
      storageLimitBytes({ plan: "PREMIUM", role: "STUDENT" })
    ).toBe(PREMIUM_STORAGE_BYTES);
  });

  it("rejects uploads past the free cap", () => {
    expect(() =>
      assertStorageRoom(
        { plan: "FREE", role: "STUDENT", storageUsedBytes: FREE_STORAGE_BYTES },
        1
      )
    ).toThrow(/Storage limit/);
  });

  it("rejects LLM over the free token cap", () => {
    expect(() =>
      assertLlmRoom(
        { plan: "FREE", role: "STUDENT", llmTokensUsed: 50_000 },
        1
      )
    ).toThrow(/token limit/);
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
