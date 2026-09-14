import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../utils/prisma.js", () => ({
  default: {
    user: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock("./sendEmail.js", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./inactivityReminder.js", () => ({
  inactivityReminderEmail: vi.fn().mockReturnValue({
    subject: "Your Shelf awaits",
    html: "<p>hi</p>",
    text: "hi",
    variantId: "awaits",
  }),
}));

import { sendEmail } from "./sendEmail.js";
import { processEmailQueueMessage } from "./emailQueueWorker.js";
import prisma from "../../utils/prisma.js";

describe("processEmailQueueMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends rendered messages via Resend path", async () => {
    await processEmailQueueMessage({
      type: "rendered",
      to: "a@b.com",
      subject: "Hello",
      html: "<p>x</p>",
      text: "x",
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "a@b.com",
        subject: "Hello",
      })
    );
  });

  it("renders inactivity reminders then marks sent", async () => {
    await processEmailQueueMessage({
      type: "inactivity_reminder",
      userId: "u1",
      to: "a@b.com",
      name: "Ada",
    });
    expect(sendEmail).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
      })
    );
  });
});
