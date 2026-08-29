import { describe, expect, it } from "vitest";
import { telegramShareLinkUrl, telegramShareTarget } from "./telegramShare";

describe("telegramShareLinkUrl", () => {
  it("builds a t.me share URL", () => {
    expect(
      telegramShareLinkUrl("https://shelf.example/my-content/shared/abc", "Polity")
    ).toBe(
      "https://t.me/share/url?url=https%3A%2F%2Fshelf.example%2Fmy-content%2Fshared%2Fabc&text=Polity"
    );
  });

  it("omits empty text", () => {
    expect(telegramShareLinkUrl("https://x.test/a")).toBe(
      "https://t.me/share/url?url=https%3A%2F%2Fx.test%2Fa"
    );
  });
});

describe("telegramShareTarget", () => {
  it("shares the open Study AI thread", () => {
    expect(telegramShareTarget("/study-ai/abc")?.kind).toBe("chat");
  });

  it("shares the open quiz", () => {
    expect(telegramShareTarget("/quiz/abc")?.kind).toBe("quiz");
  });

  it("shares an open library file", () => {
    const t = telegramShareTarget("/my-content/file/notes", {
      title: "Notes",
      pageId: "p1",
    });
    expect(t).toMatchObject({ kind: "file", pageId: "p1", title: "Notes" });
  });

  it("ignores library home", () => {
    expect(telegramShareTarget("/my-content")).toBeNull();
  });
});
