import { defineConfig } from "vitest/config";
import path from "node:path";

// Dedicated database integration config: Node environment, real PostgreSQL
// only (DATABASE_URL required). Kept separate so `npm test` never needs a
// database. Mirrors the `@` alias and the test-only server-only mock.
export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(import.meta.dirname, "./src") },
      { find: /^server-only$/, replacement: path.resolve(import.meta.dirname, "./src/test/server-only-mock.ts") },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
