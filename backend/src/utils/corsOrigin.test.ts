import { describe, expect, it } from "vitest";
import {
  allowVercelPreviewCors,
  isCorsOriginAllowed,
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

  it("defaults to localhost", () => {
    expect(parseCorsOrigins(undefined)).toEqual(["http://localhost:3000"]);
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
});
