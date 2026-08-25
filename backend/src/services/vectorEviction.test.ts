import { describe, expect, it } from "vitest";
import {
  allowedChunkCount,
  chunkHeadroom,
  chunksToEvict,
} from "../services/vectorEviction.js";

describe("vectorEviction", () => {
  const limit = 100;

  it("returns full headroom when page is new", () => {
    expect(chunkHeadroom({ limit, usedTotal: 60, previousPageChunks: 0 })).toBe(40);
  });

  it("releases previous page chunks on re-index", () => {
    expect(chunkHeadroom({ limit, usedTotal: 90, previousPageChunks: 30 })).toBe(40);
  });

  it("allows indexing when within quota", () => {
    expect(
      allowedChunkCount({
        limit,
        usedTotal: 50,
        previousPageChunks: 0,
        requestedChunks: 20,
      })
    ).toBe(20);
  });

  it("truncates when over quota", () => {
    expect(
      allowedChunkCount({
        limit,
        usedTotal: 95,
        previousPageChunks: 0,
        requestedChunks: 20,
      })
    ).toBe(5);
  });

  it("requests LRU eviction when headroom is insufficient", () => {
    expect(
      chunksToEvict({
        limit,
        usedTotal: 95,
        previousPageChunks: 0,
        requestedChunks: 20,
      })
    ).toBe(15);
  });

  it("needs no eviction when re-indexing same-sized page", () => {
    expect(
      chunksToEvict({
        limit,
        usedTotal: 100,
        previousPageChunks: 25,
        requestedChunks: 25,
      })
    ).toBe(0);
  });
});
