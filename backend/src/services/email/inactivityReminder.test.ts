import { describe, expect, it } from "vitest";
import {
  INACTIVITY_REMINDER_VARIANTS,
  inactivityReminderEmail,
  inactivityWeekKey,
  pickInactivityReminderVariant,
} from "./inactivityReminder.js";

describe("inactivityReminder", () => {
  it("exposes multiple friendly variants", () => {
    expect(INACTIVITY_REMINDER_VARIANTS.length).toBeGreaterThanOrEqual(4);
    expect(INACTIVITY_REMINDER_VARIANTS.some((v) => /awaits/i.test(v.subject))).toBe(
      true
    );
  });

  it("picks a stable variant for the same user and week", () => {
    const now = new Date("2026-09-14T12:00:00.000Z");
    const a = pickInactivityReminderVariant("user-a", now);
    const b = pickInactivityReminderVariant("user-a", now);
    expect(a.id).toBe(b.id);
  });

  it("can vary across users in the same week", () => {
    const now = new Date("2026-09-14T12:00:00.000Z");
    const ids = new Set(
      ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8"].map(
        (id) => pickInactivityReminderVariant(id, now).id
      )
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  it("builds branded html with a library CTA", () => {
    const mail = inactivityReminderEmail({
      name: "Ada Lovelace",
      userId: "user-ada",
      now: new Date("2026-09-14T12:00:00.000Z"),
    });
    expect(mail.subject.length).toBeGreaterThan(0);
    expect(mail.html).toContain("Shelf");
    expect(mail.html).toContain("/my-content");
    expect(mail.html).toContain("Ada");
    expect(mail.text).toContain("Ada");
    expect(mail.variantId).toBeTruthy();
  });

  it("formats an ISO week key", () => {
    expect(inactivityWeekKey(new Date("2026-09-14T00:00:00.000Z"))).toMatch(
      /^\d{4}-W\d{2}$/
    );
  });
});
