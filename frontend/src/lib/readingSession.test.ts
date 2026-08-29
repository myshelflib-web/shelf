import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createReadingSession,
  shouldCountReading,
} from "./readingSession";

describe("shouldCountReading", () => {
  it("counts only while the reader is visible", () => {
    expect(
      shouldCountReading({
        active: true,
        href: "/my-content/file/notes",
        visibilityState: "visible",
      })
    ).toBe(true);
    expect(
      shouldCountReading({
        active: true,
        href: "/my-content/file/notes",
        visibilityState: "hidden",
      })
    ).toBe(false);
  });

  it("stops counting off reader routes", () => {
    expect(
      shouldCountReading({
        active: true,
        href: "/dashboard",
        visibilityState: "visible",
      })
    ).toBe(false);
    expect(
      shouldCountReading({
        active: true,
        href: "/my-content",
        visibilityState: "visible",
      })
    ).toBe(false);
    expect(
      shouldCountReading({
        active: false,
        href: "/my-content/file/notes",
        visibilityState: "visible",
      })
    ).toBe(false);
  });
});

describe("createReadingSession", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("credits elapsed seconds when the session stops", () => {
    let t = 1_000;
    const commit = vi.fn();
    const session = createReadingSession({
      commit,
      now: () => t,
      setIntervalFn: () => 1,
      clearIntervalFn: () => undefined,
    });

    session.start();
    t = 13_400;
    session.stop();

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith(12);
    expect(session.isRunning()).toBe(false);
  });

  it("does not credit again after stop", () => {
    let t = 0;
    const commit = vi.fn();
    const session = createReadingSession({
      commit,
      now: () => t,
      setIntervalFn: () => 1,
      clearIntervalFn: () => undefined,
    });

    session.start();
    t = 5_000;
    session.stop();
    t = 30_000;
    session.stop();

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith(5);
  });

  it("flushes on heartbeat and keeps leftover milliseconds", () => {
    let t = 0;
    const heartbeat: { tick: (() => void) | null } = { tick: null };
    const commit = vi.fn();
    const session = createReadingSession({
      commit,
      now: () => t,
      heartbeatMs: 10_000,
      setIntervalFn: (fn) => {
        heartbeat.tick = fn;
        return 1;
      },
      clearIntervalFn: () => undefined,
    });

    session.start();
    t = 10_500;
    heartbeat.tick?.();
    expect(commit).toHaveBeenCalledWith(10);

    t = 12_500;
    session.stop();
    expect(commit).toHaveBeenLastCalledWith(2);
  });

  it("caps a stalled flush so sleep does not dump hours", () => {
    let t = 0;
    const commit = vi.fn();
    const session = createReadingSession({
      commit,
      now: () => t,
      maxFlushSeconds: 120,
      setIntervalFn: () => 1,
      clearIntervalFn: () => undefined,
    });

    session.start();
    t = 8 * 60 * 60 * 1000;
    session.stop();

    expect(commit).toHaveBeenCalledWith(120);
  });
});
