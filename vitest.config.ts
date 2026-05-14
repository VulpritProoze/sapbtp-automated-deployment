import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 80,
        lines: 70,
      },
      exclude: ["src/cli.ts"],
    },
  },
});
