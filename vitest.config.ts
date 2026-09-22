import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(import.meta.dirname, "./src") },
      // Test-only: resolve the server-only boundary marker to an empty
      // module. Production (Next react-server condition) keeps the real
      // marker, so client imports of server code still fail loudly there.
      { find: /^server-only$/, replacement: path.resolve(import.meta.dirname, "./src/test/server-only-mock.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", "dist/**", "tests/**", "**/*.html"],
    css: false,
  },
});
