import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { AnalyticsProvider } from "./types";
import { AnalyticsEvents } from "./events";
import { __setAnalyticsProviderForTests } from "./client";
import {
  captureClientError,
  installClientErrorMonitoring,
  isChunkLoadMessage,
  reportApiFailure,
} from "./errors";

function mockProvider(): AnalyticsProvider & {
  tracks: Array<{ event: string; props?: Record<string, unknown> }>;
  exceptions: Error[];
} {
  const tracks: Array<{ event: string; props?: Record<string, unknown> }> = [];
  const exceptions: Error[] = [];
  return {
    tracks,
    exceptions,
    init: vi.fn(),
    track: (event, properties) => tracks.push({ event, props: properties }),
    identify: vi.fn(),
    reset: vi.fn(),
    pageview: vi.fn(),
    captureException: (error) => exceptions.push(error),
  };
}

describe("analytics errors", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { href: "https://app.test/quiz", pathname: "/quiz", search: "" },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("detects chunk load messages", () => {
    expect(isChunkLoadMessage("Loading chunk 12 failed")).toBe(true);
    expect(isChunkLoadMessage("network error")).toBe(false);
  });

  it("reports API failures with request id", () => {
    const provider = mockProvider();
    __setAnalyticsProviderForTests(provider);

    reportApiFailure({
      path: "/api/quiz",
      method: "POST",
      status: 503,
      message: "Service unavailable",
      requestId: "req-123",
    });

    expect(provider.tracks).toHaveLength(1);
    expect(provider.tracks[0]?.event).toBe(AnalyticsEvents.apiRequestFailed);
    expect(provider.tracks[0]?.props?.request_id).toBe("req-123");
    expect(provider.tracks[0]?.props?.status).toBe(503);
    expect(provider.exceptions).toHaveLength(0);
  });

  it("captures JS errors and sends exception payload", () => {
    const provider = mockProvider();
    __setAnalyticsProviderForTests(provider);

    captureClientError({
      kind: "js_error",
      message: "boom",
      stack: "Error: boom\n at x",
    });

    expect(provider.tracks[0]?.event).toBe(AnalyticsEvents.clientError);
    expect(provider.exceptions[0]?.message).toBe("boom");
  });

  it("dedupes identical errors within the window", () => {
    const provider = mockProvider();
    __setAnalyticsProviderForTests(provider);

    captureClientError({ kind: "js_error", message: "repeat" });
    captureClientError({ kind: "js_error", message: "repeat" });

    expect(provider.tracks).toHaveLength(1);
  });

  it("installs global error listeners", () => {
    const add = vi.fn();
    const remove = vi.fn();
    vi.stubGlobal("window", {
      location: { href: "https://app.test", pathname: "/", search: "" },
      addEventListener: add,
      removeEventListener: remove,
    });

    const uninstall = installClientErrorMonitoring();
    expect(add).toHaveBeenCalledWith("error", expect.any(Function));
    expect(add).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
    uninstall();
    expect(remove).toHaveBeenCalled();
  });
});
