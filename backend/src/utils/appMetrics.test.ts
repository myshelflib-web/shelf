import { describe, expect, it, beforeEach } from "vitest";
import {
  httpRouteGroup,
  httpStatusClass,
  recordLlmCall,
} from "./appMetrics.js";
import { metrics } from "./metrics.js";

describe("appMetrics", () => {
  beforeEach(() => {
    metrics.reset();
  });

  it("maps API paths to route groups", () => {
    expect(httpRouteGroup("/api/study/ask")).toBe("study");
    expect(httpRouteGroup("/api/quiz/abc")).toBe("quiz");
    expect(httpRouteGroup("/health")).toBe("ops");
  });

  it("classifies HTTP status codes", () => {
    expect(httpStatusClass(200)).toBe("2xx");
    expect(httpStatusClass(404)).toBe("4xx");
    expect(httpStatusClass(503)).toBe("5xx");
  });

  it("records LLM tokens and estimated cost", () => {
    recordLlmCall({
      flow: "study_chat",
      model: "gemini-flash-latest",
      ok: true,
      stream: false,
      durationMs: 1200,
      promptTokens: 500,
      completionTokens: 200,
    });

    const snap = metrics.snapshot();
    expect(snap.counters["llm_requests_total{flow=study_chat,model=gemini-flash-latest,ok=true,route=unknown,stream=false}"]?.value).toBe(1);
    expect(
      snap.sums["llm_tokens_total{flow=study_chat,kind=total,model=gemini-flash-latest}"]?.value
    ).toBe(700);
    expect(
      snap.sums["llm_cost_usd_total{flow=study_chat,model=gemini-flash-latest}"]?.value
    ).toBeGreaterThan(0);
  });
});
