import { describe, expect, it } from "vitest";
import { contentGenConcurrency } from "./contentGenConcurrency.js";

describe("contentGenConcurrency", () => {
  it("defaults to 2 and clamps to 1–3", () => {
    const prev = process.env.CONTENT_GEN_CONCURRENCY;
    delete process.env.CONTENT_GEN_CONCURRENCY;
    expect(contentGenConcurrency()).toBe(2);

    process.env.CONTENT_GEN_CONCURRENCY = "1";
    expect(contentGenConcurrency()).toBe(1);

    process.env.CONTENT_GEN_CONCURRENCY = "8";
    expect(contentGenConcurrency()).toBe(3);

    process.env.CONTENT_GEN_CONCURRENCY = "0";
    expect(contentGenConcurrency()).toBe(2);

    if (prev === undefined) delete process.env.CONTENT_GEN_CONCURRENCY;
    else process.env.CONTENT_GEN_CONCURRENCY = prev;
  });
});
