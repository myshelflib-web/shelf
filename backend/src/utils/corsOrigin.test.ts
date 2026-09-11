import { describe, expect, it } from "vitest";
import {
  allowLanDevCors,
  allowVercelPreviewCors,
  isCorsOriginAllowed,
  isPrivateLanHttpOrigin,
  isVercelPreviewOrigin,
  parseCorsOrigins,
  resolveBucketCorsOrigins,
} from "./corsOrigin.js";

describe("parseCorsOrigins", () => {
  it("splits and trims", () => {
    expect(parseCorsOrigins(" https://a.com ,https://b.com ")).toEqual([
      "https://a.com",
      "https://b.com",
    ]);
  });

  it("defaults to localhost and Android emulator alias", () => {
    expect(parseCorsOrigins(undefined)).toEqual([
      "http://localhost:3000",
      "http://10.0.2.2:3000",
    ]);
  });
});

describe("resolveBucketCorsOrigins", () => {
  it("uses S3_CORS_ORIGINS override when set", () => {
    expect(
      resolveBucketCorsOrigins(
        "https://staging.myshelflib.com",
        true,
        "*,https://staging.myshelflib.com"
      )
    ).toEqual(["*", "https://staging.myshelflib.com"]);
  });

  it("uses * when Vercel preview CORS is enabled", () => {
    expect(
      resolveBucketCorsOrigins("https://staging.myshelflib.com", true, undefined)
    ).toEqual(["*"]);
  });

  it("mirrors CORS_ORIGIN when previews are off", () => {
    expect(
      resolveBucketCorsOrigins(
        "https://www.myshelflib.com,https://myshelflib.com",
        false,
        undefined
      )
    ).toEqual(["https://www.myshelflib.com", "https://myshelflib.com"]);
  });
});

describe("allowVercelPreviewCors", () => {
  it("accepts truthy flags", () => {
    expect(allowVercelPreviewCors("true")).toBe(true);
    expect(allowVercelPreviewCors("1")).toBe(true);
    expect(allowVercelPreviewCors("yes")).toBe(true);
  });

  it("rejects off / empty", () => {
    expect(allowVercelPreviewCors("")).toBe(false);
    expect(allowVercelPreviewCors("false")).toBe(false);
    expect(allowVercelPreviewCors(undefined)).toBe(false);
  });
});

describe("allowLanDevCors", () => {
  it("defaults on for local (non-production)", () => {
    expect(allowLanDevCors(undefined, "development", undefined)).toBe(true);
    expect(allowLanDevCors(undefined, undefined, undefined)).toBe(true);
  });

  it("defaults off for production", () => {
    expect(allowLanDevCors(undefined, "production", undefined)).toBe(false);
    expect(allowLanDevCors(undefined, "development", "production")).toBe(false);
  });

  it("respects explicit flag", () => {
    expect(allowLanDevCors("true", "production", "production")).toBe(true);
    expect(allowLanDevCors("false", "development", undefined)).toBe(false);
  });
});

describe("isPrivateLanHttpOrigin", () => {
  it("allows localhost and emulator alias", () => {
    expect(isPrivateLanHttpOrigin("http://localhost:3000")).toBe(true);
    expect(isPrivateLanHttpOrigin("http://10.0.2.2:3000")).toBe(true);
  });

  it("allows RFC1918 LAN http origins", () => {
    expect(isPrivateLanHttpOrigin("http://192.168.1.4:3000")).toBe(true);
    expect(isPrivateLanHttpOrigin("http://10.0.0.5:3000")).toBe(true);
    expect(isPrivateLanHttpOrigin("http://172.16.0.2:3000")).toBe(true);
  });

  it("rejects public and https LAN", () => {
    expect(isPrivateLanHttpOrigin("https://192.168.1.4:3000")).toBe(false);
    expect(isPrivateLanHttpOrigin("http://8.8.8.8:3000")).toBe(false);
    expect(isPrivateLanHttpOrigin("http://evil.com")).toBe(false);
  });
});

describe("isVercelPreviewOrigin", () => {
  it("allows https vercel.app hosts", () => {
    expect(isVercelPreviewOrigin("https://shelf-git-feat-team.vercel.app")).toBe(
      true
    );
    expect(isVercelPreviewOrigin("https://my-app.vercel.app")).toBe(true);
  });

  it("rejects non-preview origins", () => {
    expect(isVercelPreviewOrigin("http://my-app.vercel.app")).toBe(false);
    expect(isVercelPreviewOrigin("https://evil.com")).toBe(false);
    expect(isVercelPreviewOrigin("https://vercel.app.evil.com")).toBe(false);
  });
});

describe("isCorsOriginAllowed", () => {
  const allowed = ["https://app.example.com"];

  it("allows missing origin", () => {
    expect(isCorsOriginAllowed(undefined, allowed, false)).toBe(true);
  });

  it("allows exact list matches", () => {
    expect(isCorsOriginAllowed("https://app.example.com", allowed, false)).toBe(
      true
    );
  });

  it("rejects unknown when previews off", () => {
    expect(
      isCorsOriginAllowed("https://x.vercel.app", allowed, false)
    ).toBe(false);
  });

  it("allows vercel previews when enabled", () => {
    expect(
      isCorsOriginAllowed("https://x-git-branch.vercel.app", allowed, true)
    ).toBe(true);
  });

  it("allows LAN http when lan flag on", () => {
    expect(
      isCorsOriginAllowed("http://192.168.1.4:3000", allowed, false, true)
    ).toBe(true);
  });

  it("rejects LAN http when lan flag off", () => {
    expect(
      isCorsOriginAllowed("http://192.168.1.4:3000", allowed, false, false)
    ).toBe(false);
  });
});
