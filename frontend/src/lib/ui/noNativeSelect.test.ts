import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(path, acc);
    } else if (/\.(tsx|jsx)$/.test(name)) {
      acc.push(path);
    }
  }
  return acc;
}

describe("no native select elements", () => {
  it("uses ShelfSelect instead of <select> in frontend source", () => {
    const srcRoot = join(__dirname, "../..");
    const offenders: string[] = [];

    for (const file of walk(srcRoot)) {
      const source = readFileSync(file, "utf8");
      if (/<select[\s>/]/.test(source)) {
        offenders.push(file.replace(`${srcRoot}/`, ""));
      }
    }

    expect(offenders).toEqual([]);
  });
});
