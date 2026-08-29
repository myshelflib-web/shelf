import { describe, expect, it } from "vitest";
import { canonicalWatchUrl, parseYoutubeUrl } from "./youtubeUrl";

describe("parseYoutubeUrl", () => {
  it("parses common YouTube video URLs", () => {
    expect(parseYoutubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      kind: "video",
      videoId: "dQw4w9WgXcQ",
    });
    expect(parseYoutubeUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      kind: "video",
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("imports /playlist as a playlist and keeps watch+list as one lecture", () => {
    expect(
      parseYoutubeUrl("https://www.youtube.com/playlist?list=PLtestplaylist12")
    ).toEqual({ kind: "playlist", playlistId: "PLtestplaylist12" });
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
});

describe("canonicalWatchUrl", () => {
  it("builds a watch URL", () => {
    expect(canonicalWatchUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
  });
});
