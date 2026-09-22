import { afterEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db/client";

describe("db client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws a clear error when DATABASE_URL is missing instead of connecting nowhere", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(() => getDb()).toThrow("DATABASE_URL is not set");
  });
});
