import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/utils/**/*.ts", "src/docPaths.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
