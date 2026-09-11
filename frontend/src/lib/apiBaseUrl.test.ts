import { afterEach, describe, expect, it } from "vitest";
import { getApiUrl, API_URL } from "./apiBaseUrl";

describe("getApiUrl", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    if (originalWindow === undefined) {
      // @ts-expect-error restore SSR-like
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  });

  it("returns configured URL without window", () => {
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    expect(getApiUrl()).toBe(API_URL);
  });

  it("keeps localhost when page is localhost", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: { hostname: "localhost" } },
    });
    expect(getApiUrl()).toBe(API_URL);
  });

  it("rewrites localhost API host to Android emulator alias", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: { hostname: "10.0.2.2" } },
    });
    expect(getApiUrl()).toBe("http://10.0.2.2:4000");
  });

  it("rewrites localhost API host to LAN page host", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: { hostname: "192.168.1.10" } },
    });
    expect(getApiUrl()).toBe("http://192.168.1.10:4000");
  });
});
