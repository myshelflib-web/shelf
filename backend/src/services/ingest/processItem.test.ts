import { describe, expect, it, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
const createIngestJob = vi.fn();
const publishIngestMessage = vi.fn();

vi.mock("../../utils/prisma.js", () => ({
  default: {
    ingestItem: {
      findMany,
      findUnique,
      update,
    },
  },
}));

vi.mock("./ingestJobs.js", () => ({
  createIngestJob,
}));

vi.mock("./sqsPublisher.js", () => ({
  publishIngestMessage,
}));

describe("bulkApproveIngestItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMany.mockResolvedValue([{ id: "a1" }, { id: "a2" }]);
    findUnique.mockResolvedValue({ sourceId: "src-1" });
    update.mockResolvedValue({});
    createIngestJob.mockResolvedValue({ id: "job-1" });
    publishIngestMessage.mockResolvedValue("sqs-1");
  });

  it("approves explicit ids", async () => {
    const { bulkApproveIngestItems } = await import("./processItem.js");
    const result = await bulkApproveIngestItems({ ids: ["x1", "x2"] });
    expect(result.approved).toBe(2);
    expect(result.failed).toBe(0);
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("loads pending items when ids omitted", async () => {
    const { bulkApproveIngestItems } = await import("./processItem.js");
    const result = await bulkApproveIngestItems({
      status: "PENDING_REVIEW",
      limit: 10,
    });
    expect(findMany).toHaveBeenCalled();
    expect(result.approved).toBe(2);
  });
});
