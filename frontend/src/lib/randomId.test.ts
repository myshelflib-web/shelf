import { describe, expect, it, vi } from "vitest";
import { randomId } from "./randomId";

describe("randomId", () => {
  it("uses crypto.randomUUID when available", () => {
    const spy = vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "11111111-1111-1111-1111-111111111111"
    );
    expect(randomId()).toBe("11111111-1111-1111-1111-111111111111");
    spy.mockRestore();
  });

  it("falls back when randomUUID is missing", () => {
    const original = crypto.randomUUID;
    // @ts-expect-error — simulate older WebView
    crypto.randomUUID = undefined;
    const id = randomId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/i);
    crypto.randomUUID = original;
  });
});
