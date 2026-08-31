import { describe, expect, it } from "vitest";
import { redactEmail, sanitizeLogFields } from "./logRedact.js";

describe("logRedact", () => {
  it("redacts sensitive keys", () => {
    const out = sanitizeLogFields({
      password: "secret123",
      token: "abc",
      userId: "u1",
    });
    expect(out.password).toBe("[redacted]");
    expect(out.token).toBe("[redacted]");
    expect(out.userId).toBe("u1");
  });

  it("masks email addresses", () => {
    expect(redactEmail("alice@example.com")).toBe("a****@example.com");
    const out = sanitizeLogFields({ email: "bob@test.io" });
    expect(out.email).toBe("b**@test.io");
  });

  it("redacts bearer tokens in values", () => {
    const out = sanitizeLogFields({
      note: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    });
    expect(out.note).toBe("[redacted]");
  });
});
