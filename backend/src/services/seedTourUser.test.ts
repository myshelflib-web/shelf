import { afterEach, describe, expect, it } from "vitest";
import { shouldSeedTourUser } from "./seedTourUser.js";

describe("shouldSeedTourUser", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env.SEED_TOUR_USER = prev.SEED_TOUR_USER;
    process.env.OTEL_DEPLOYMENT_ENVIRONMENT = prev.OTEL_DEPLOYMENT_ENVIRONMENT;
    if (prev.SEED_TOUR_USER === undefined) delete process.env.SEED_TOUR_USER;
    if (prev.OTEL_DEPLOYMENT_ENVIRONMENT === undefined) {
      delete process.env.OTEL_DEPLOYMENT_ENVIRONMENT;
    }
  });

  it("is true on staging", () => {
    delete process.env.SEED_TOUR_USER;
    process.env.OTEL_DEPLOYMENT_ENVIRONMENT = "staging";
    expect(shouldSeedTourUser()).toBe(true);
  });

  it("is false on production", () => {
    delete process.env.SEED_TOUR_USER;
    process.env.OTEL_DEPLOYMENT_ENVIRONMENT = "production";
    expect(shouldSeedTourUser()).toBe(false);
  });

  it("respects SEED_TOUR_USER override", () => {
    process.env.OTEL_DEPLOYMENT_ENVIRONMENT = "production";
    process.env.SEED_TOUR_USER = "true";
    expect(shouldSeedTourUser()).toBe(true);
    process.env.OTEL_DEPLOYMENT_ENVIRONMENT = "staging";
    process.env.SEED_TOUR_USER = "false";
    expect(shouldSeedTourUser()).toBe(false);
  });
});
