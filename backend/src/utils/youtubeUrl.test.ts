import { describe, expect, it } from "vitest";
import { canonicalWatchUrl, parseYoutubeUrl } from "./youtubeUrl.js";

describe("parseYoutubeUrl", () => {
  it("parses watch, short, embed, and youtu.be links", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      kind: "video",
      videoId: "dQw4w9WgXcQ",
    });
    expect(parseYoutubeUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      kind: "video",
      videoId: "dQw4w9WgXcQ",
    });
    expect(parseYoutubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toEqual({
      kind: "video",
      videoId: "dQw4w9WgXcQ",
    });
    expect(parseYoutubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toEqual({
      kind: "video",
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("treats /playlist as a full playlist import", () => {
    expect(
      parseYoutubeUrl("https://www.youtube.com/playlist?list=PLtestplaylist12")
    ).toEqual({ kind: "playlist", playlistId: "PLtestplaylist12" });
  });

  it("keeps a watch+list URL as one video with playlist context", () => {
    expect(
      parseYoutubeUrl(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtestplaylist12"
      )
    ).toEqual({
      kind: "video",
      videoId: "dQw4w9WgXcQ",
      playlistId: "PLtestplaylist12",
    });
  });

  it("rejects non-YouTube hosts", () => {
    expect(parseYoutubeUrl("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYoutubeUrl("not a url")).toBeNull();
  });
});

describe("canonicalWatchUrl", () => {
  it("normalizes to youtube.com/watch", () => {
    expect(canonicalWatchUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    expect(canonicalWatchUrl("dQw4w9WgXcQ", "PLabc")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc"
    );
  });
});
