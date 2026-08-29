import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveMx = vi.fn();
const resolve4 = vi.fn();
const resolve6 = vi.fn();

vi.mock("node:dns", () => ({
  promises: {
    resolveMx: (...a: unknown[]) => resolveMx(...a),
    resolve4: (...a: unknown[]) => resolve4(...a),
    resolve6: (...a: unknown[]) => resolve6(...a),
  },
}));

import {
  assertDeliverableEmail,
  clearEmailDomainCache,
  InvalidEmailError,
  isValidEmailFormat,
} from "./validateEmail.js";

describe("isValidEmailFormat", () => {
  it("accepts normal addresses", () => {
    expect(isValidEmailFormat("user@gmail.com")).toBe(true);
    expect(isValidEmailFormat("first.last+tag@university.edu.in")).toBe(true);
  });

  it("rejects missing TLD, spaces, and IPs", () => {
    expect(isValidEmailFormat("not-an-email")).toBe(false);
    expect(isValidEmailFormat("user@localhost")).toBe(false);
    expect(isValidEmailFormat("user@gmail")).toBe(false);
    expect(isValidEmailFormat("user name@gmail.com")).toBe(false);
    expect(isValidEmailFormat("user@127.0.0.1")).toBe(false);
  });

  it("rejects reserved and example domains", () => {
    expect(isValidEmailFormat("user@example.com")).toBe(false);
    expect(isValidEmailFormat("user@foo.test")).toBe(false);
  });
});

describe("assertDeliverableEmail", () => {
  beforeEach(() => {
    clearEmailDomainCache();
    resolveMx.mockReset();
    resolve4.mockReset();
    resolve6.mockReset();
  });

  it("normalizes and allows a domain with MX records", async () => {
    resolveMx.mockResolvedValue([{ exchange: "aspmx.l.google.com", priority: 1 }]);
    await expect(assertDeliverableEmail("  User@Gmail.COM ")).resolves.toBe(
      "user@gmail.com"
    );
  });

  it("rejects domains with no MX or A records", async () => {
    const nx = Object.assign(new Error("not found"), { code: "ENOTFOUND" });
    resolveMx.mockRejectedValue(nx);
    resolve4.mockRejectedValue(nx);
    resolve6.mockRejectedValue(nx);
    await expect(assertDeliverableEmail("nobody@notareal-tld-xyz.invalidxyz")).rejects.toBeInstanceOf(
      InvalidEmailError
    );
  });

  it("rejects domains that publish a null MX", async () => {
    resolveMx.mockResolvedValue([{ exchange: ".", priority: 0 }]);
    await expect(assertDeliverableEmail("nobody@nomail.example-host.edu")).rejects.toThrow(
      /cannot receive mail/
    );
  });

  it("falls back to A records when MX is empty", async () => {
    resolveMx.mockRejectedValue(
      Object.assign(new Error("no data"), { code: "ENODATA" })
    );
    resolve4.mockResolvedValue(["93.184.216.34"]);
    await expect(assertDeliverableEmail("webmaster@example-host.edu")).resolves.toBe(
      "webmaster@example-host.edu"
    );
  });

  it("rejects disposable inboxes without a DNS lookup", async () => {
    await expect(assertDeliverableEmail("a@mailinator.com")).rejects.toThrow(
      /permanent email/
    );
    expect(resolveMx).not.toHaveBeenCalled();
  });

  it("does not block on transient DNS failures", async () => {
    resolveMx.mockRejectedValue(
      Object.assign(new Error("timeout"), { code: "ETIMEOUT" })
    );
    await expect(assertDeliverableEmail("user@gmail.com")).resolves.toBe(
      "user@gmail.com"
    );
  });
});
