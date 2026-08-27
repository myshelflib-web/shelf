import { describe, expect, it } from "vitest";
import { groupFilesForBulkUpload } from "./myContentAddUtils";

function file(name: string, rel?: string): File {
  const f = new File(["x"], name, { type: "application/pdf" });
  if (rel) {
    Object.defineProperty(f, "webkitRelativePath", { value: rel });
  }
  return f;
}

describe("groupFilesForBulkUpload", () => {
  it("groups by top-level folder name", () => {
    const groups = groupFilesForBulkUpload([
      file("a.pdf", "Polity/a.pdf"),
      file("b.pdf", "Polity/b.pdf"),
      file("c.pdf", "History/c.pdf"),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.topicTitle === "Polity")?.files).toHaveLength(2);
    expect(groups.find((g) => g.topicTitle === "History")?.files).toHaveLength(1);
  });

  it("uses first segment for nested folders", () => {
    const groups = groupFilesForBulkUpload([
      file("deep.pdf", "Polity/Unit1/deep.pdf"),
    ]);
    expect(groups[0]?.topicTitle).toBe("Polity");
  });

  it("puts root-level files on the collection", () => {
    const groups = groupFilesForBulkUpload([file("root.pdf", "root.pdf")]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.topicTitle).toBeNull();
  });
});
