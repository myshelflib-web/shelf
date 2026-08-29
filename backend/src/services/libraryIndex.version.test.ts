import { describe, expect, it } from "vitest";
import {
  INDEX_CONTENT_VERSION,
  INDEX_LEASE_PREFIX,
  isFreshIndexLease,
  isIndexLeaseHash,
} from "./libraryIndexText.js";

describe("INDEX_CONTENT_VERSION", () => {
  it("prefixes content hashes so the worker can detect outdated rows", () => {
    expect(INDEX_CONTENT_VERSION).toMatch(/^v\d+$/);
    const sample = `${INDEX_CONTENT_VERSION}:abcd1234efgh5678`;
    expect(sample.startsWith(`${INDEX_CONTENT_VERSION}:`)).toBe(true);
    expect("deadbeefdeadbeef".startsWith(`${INDEX_CONTENT_VERSION}:`)).toBe(false);
  });
});

describe("index leases", () => {
  it("marks in-flight hashes so a crashed index run is not retried immediately", () => {
    const hash = `${INDEX_LEASE_PREFIX}${Date.now()}`;
    expect(isIndexLeaseHash(hash)).toBe(true);
    expect(isIndexLeaseHash(`${INDEX_CONTENT_VERSION}:abcd1234efgh5678`)).toBe(
      false
    );
    expect(isFreshIndexLease(new Date(), Date.now(), 15 * 60 * 1000)).toBe(true);
    expect(
      isFreshIndexLease(new Date(Date.now() - 20 * 60 * 1000), Date.now(), 15 * 60 * 1000)
    ).toBe(false);
  });
});
