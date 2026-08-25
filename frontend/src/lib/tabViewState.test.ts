import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLastRead,
  getNotebookLastRead,
  getRecentNotebookReads,
  getTabViewState,
  hydrateLastReads,
  pickNewerView,
  setLastRead,
  setTabViewState,
  viewStateFromPage,
} from "./tabViewState";

describe("tabViewState", () => {
  const mem = new Map<string, string>();

  beforeEach(() => {
    mem.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
    });
  });

  it("stores and merges view state per href", () => {
    setTabViewState("/my-content/ncert/file/laxmikanth", { pdfPage: 42 });
    setTabViewState("/my-content/ncert/file/laxmikanth", { pageOffset: 0.3 });
    expect(getTabViewState("/my-content/ncert/file/laxmikanth")).toMatchObject({
      pdfPage: 42,
      pageOffset: 0.3,
    });
    expect(getTabViewState("/my-content/ncert/file/laxmikanth")?.updatedAt).toEqual(
      expect.any(Number)
    );
  });

  it("remembers last document per notebook and globally", () => {
    setLastRead({
      href: "/my-content/ncert/file/laxmikanth",
      title: "Laxmikanth",
      notebookSlug: "ncert",
      topicSlug: null,
    });
    expect(getLastRead()?.href).toBe("/my-content/ncert/file/laxmikanth");
    expect(getNotebookLastRead("ncert")?.title).toBe("Laxmikanth");
    expect(getNotebookLastRead("other")).toBeNull();
  });

  it("remembers last document per topic", () => {
    setLastRead({
      href: "/my-content/ncert/polity/preamble",
      title: "Preamble",
      notebookSlug: "ncert",
      topicSlug: "polity",
    });
    expect(getNotebookLastRead("ncert", "polity")?.title).toBe("Preamble");
    expect(getNotebookLastRead("ncert")?.title).toBe("Preamble");
  });

  it("prefers the newer of local vs server view", () => {
    const local = { pdfPage: 10, updatedAt: 100 };
    const server = { pdfPage: 40, updatedAt: 200 };
    expect(pickNewerView(local, server)?.pdfPage).toBe(40);
    expect(pickNewerView({ ...local, updatedAt: 300 }, server)?.pdfPage).toBe(10);
  });

  it("maps a page payload from the API", () => {
    expect(
      viewStateFromPage({
        pdfPage: 12,
        pageOffset: 0.4,
        viewedAt: "2026-08-22T00:00:00.000Z",
      })
    ).toMatchObject({ pdfPage: 12, pageOffset: 0.4 });
  });

  it("hydrates last-read from the account when newer", () => {
    setLastRead({
      href: "/old",
      title: "Old",
      notebookSlug: "ncert",
      viewedAt: 10,
    });
    hydrateLastReads({
      last: {
        href: "/new",
        title: "New",
        notebookSlug: "ncert",
        viewedAt: 20,
      },
      notebooks: {
        ncert: {
          href: "/new",
          title: "New",
          notebookSlug: "ncert",
          viewedAt: 20,
        },
      },
    });
    expect(getLastRead()?.href).toBe("/new");
    expect(getNotebookLastRead("ncert")?.title).toBe("New");
  });

  it("lists notebook-level last reads newest first", () => {
    setLastRead({
      href: "/my-content/econ/file/monetary",
      title: "Monetary Policy",
      notebookSlug: "econ",
      viewedAt: 10,
    });
    setLastRead({
      href: "/my-content/econ/macro/gdp",
      title: "GDP",
      notebookSlug: "econ",
      topicSlug: "macro",
      viewedAt: 20,
    });
    setLastRead({
      href: "/my-content/history/file/rome",
      title: "Rome",
      notebookSlug: "history",
      viewedAt: 30,
    });
    expect(getRecentNotebookReads().map((r) => r.notebookSlug)).toEqual([
      "history",
      "econ",
    ]);
  });

  it("clears stale local continue-reading when the account has none", () => {
    setLastRead({
      href: "/my-content/file/ghost",
      title: "Untitled",
      notebookSlug: null,
      viewedAt: 99,
    });
    hydrateLastReads({ last: null, notebooks: {} });
    expect(getLastRead()).toBeNull();
    expect(getNotebookLastRead("ncert")).toBeNull();
  });
});
