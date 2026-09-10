import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { uploadLibraryFile } from "./uploadLibraryFile";
import type { UserPageSummary } from "@/types";

vi.mock("@/lib/accountLocalState", () => ({
  getStoredUserId: () => "user-1",
}));

vi.mock("@/lib/seedPdfByteCache", () => ({
  seedPdfByteCache: vi.fn(async () => undefined),
}));

vi.mock("@/lib/pdfCompressDecision", () => ({
  decidePdfCompress: () => ({ attempt: false, clientPacked: false }),
  shouldAttemptPdfCompress: async () => false,
}));

vi.mock("@/lib/compressUploadFile", () => ({
  compressUploadFile: async (f: File) => f,
  shouldCompressUpload: () => false,
}));

const putPendingUpload = vi.fn(async (..._args: unknown[]) => undefined);
const scheduleFlushPendingUploads = vi.fn((..._args: unknown[]) => undefined);

vi.mock("@/lib/pendingUploadQueue", async () => {
  const actual = await vi.importActual<typeof import("./pendingUploadQueue")>(
    "./pendingUploadQueue"
  );
  return {
    ...actual,
    putPendingUpload: (...args: unknown[]) => putPendingUpload(...args),
  };
});

vi.mock("@/lib/flushPendingUploads", () => ({
  scheduleFlushPendingUploads: (...args: unknown[]) =>
    scheduleFlushPendingUploads(...args),
  flushPendingUploads: vi.fn(async () => 0),
}));

function draftPage(): UserPageSummary {
  return {
    id: "page-1",
    title: "Test",
    slug: "test",
    status: "DRAFT",
    order: 0,
    completed: false,
    starred: false,
    contentType: "PDF",
  };
}

describe("uploadLibraryFile deferred on PUT failure", () => {
  beforeEach(() => {
    putPendingUpload.mockClear();
    scheduleFlushPendingUploads.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps local draft and queues retry instead of abandoning", async () => {
    const onEarlyReady = vi.fn();
    const onDraftAbandoned = vi.fn();
    const deletePage = vi.fn();
    const file = new File([new Uint8Array([1, 2, 3, 4])], "test.pdf", {
      type: "application/pdf",
    });

    const initPayload = {
      uploadUrl: "https://storage.example/put",
      headers: { "Content-Type": "application/pdf" as const },
      token: "tok",
      page: draftPage(),
      pdfCacheVersion: "key:4",
    };

    const pending = uploadLibraryFile({
      file,
      title: "Test",
      scope: {},
      onEarlyReady,
      onDraftAbandoned,
      deletePage,
      request: (async () => initPayload) as <T>() => Promise<T>,
      putToUrl: async () => {
        throw new Error("CORS blocked");
      },
    });

    await vi.runAllTimersAsync();
    const result = await pending;

    expect(onEarlyReady).toHaveBeenCalledOnce();
    expect(result.deferred).toBe(true);
    expect(result.page.id).toBe("page-1");
    expect(putPendingUpload).toHaveBeenCalledOnce();
    // CORS cannot be fixed by retry — do not schedule background flushes.
    expect(scheduleFlushPendingUploads).not.toHaveBeenCalled();
    expect(deletePage).not.toHaveBeenCalled();
    expect(onDraftAbandoned).not.toHaveBeenCalled();
  });
});
