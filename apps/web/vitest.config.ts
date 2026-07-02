import { defineConfig } from "vitest/config";

// Web unit tests cover the logic seams (API client, session cookie, guard) —
// not React rendering, so the node environment is enough (see F04b spec).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
