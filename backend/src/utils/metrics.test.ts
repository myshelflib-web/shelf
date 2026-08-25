import { describe, expect, it, beforeEach } from "vitest";
import { metrics } from "./metrics.js";

describe("metrics", () => {
  beforeEach(() => {
    metrics.reset();
  });

  it("increments counters with labels", () => {
    metrics.inc("requests", { status: 200 });
    metrics.inc("requests", { status: 200 }, 2);
    const snap = metrics.snapshot();
    expect(snap.counters["requests{status=200}"].value).toBe(3);
  });

  it("records histogram stats", () => {
    metrics.observe("latency", 10, { route: "a" });
    metrics.observe("latency", 30, { route: "a" });
    const h = metrics.snapshot().histograms["latency{route=a}"];
    expect(h.count).toBe(2);
    expect(h.minMs).toBe(10);
    expect(h.maxMs).toBe(30);
    expect(h.avgMs).toBe(20);
  });

  it("times successful and failed async work", async () => {
    await metrics.time("op", async () => 1, { name: "ok" });
    await expect(
      metrics.time("op", async () => {
        throw new Error("fail");
      }, { name: "fail" })
    ).rejects.toThrow("fail");

    const snap = metrics.snapshot();
    expect(snap.histograms["op{name=ok,ok=true}"].count).toBe(1);
    expect(snap.histograms["op{name=fail,ok=false}"].count).toBe(1);
  });
});
