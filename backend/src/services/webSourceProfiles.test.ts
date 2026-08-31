import { describe, expect, it } from "vitest";
import {
  siteRestrictClause,
  webSourceProfile,
  WEB_SOURCE_PROFILES,
} from "./webSourceProfiles.js";
import { buildWebSearchTool } from "./studyWebToolSchemas.js";

describe("webSourceProfiles", () => {
  it("includes UPSC-specific domains", () => {
    const profile = webSourceProfile("UPSC");
    expect(profile.preferredDomains).toContain("upsc.gov.in");
    expect(profile.preferredDomains).toContain("pib.gov.in");
    expect(profile.generalDomains).toContain("medium.com");
    expect(profile.generalDomains).toContain("quora.com");
  });

  it("includes NEET-specific domains", () => {
    const profile = webSourceProfile("NEET_PG");
    expect(profile.preferredDomains).toContain("ncbi.nlm.nih.gov");
  });

  it("builds site restrict clause", () => {
    expect(siteRestrictClause(["a.com", "b.org"])).toBe(
      "site:a.com OR site:b.org"
    );
  });
});

describe("buildWebSearchTool", () => {
  it("embeds track domains in schema description", () => {
    const tool = buildWebSearchTool("UPSC");
    expect(tool.function.description).toMatch(/UPSC/i);
    expect(tool.function.description).toMatch(/Medium/);
    const params = tool.function.parameters as {
      properties?: { sourceScope?: { enum?: string[] } };
    };
    expect(params.properties?.sourceScope?.enum).toContain("track");
  });

  it("covers every study goal", () => {
    for (const goal of Object.keys(WEB_SOURCE_PROFILES)) {
      expect(buildWebSearchTool(goal as keyof typeof WEB_SOURCE_PROFILES)).toBeDefined();
    }
  });
});
