import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class strings", () => {
    expect(cn("block", "px-3")).toBe("block px-3");
  });

  it("resolves conflicting Tailwind utilities to the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("bg-white", "bg-ink")).toBe("bg-ink");
  });

  it("ignores falsy and conditional values", () => {
    const hidden = false;
    expect(cn("block", hidden && "hidden", undefined, "px-3")).toBe("block px-3");
  });

  it("supports arrays and objects", () => {
    expect(cn(["a", "b"])).toBe("a b");
    expect(cn({ active: true, disabled: false })).toBe("active");
  });
});
