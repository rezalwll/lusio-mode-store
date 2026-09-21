import { describe, expect, it } from "vitest";
import { formatDate, formatNumber, formatToman, toFa } from "@/lib/format";

describe("toFa", () => {
  it("converts Latin digits to Persian digits", () => {
    expect(toFa(0)).toBe("۰");
    expect(toFa(1234567890)).toBe("۱۲۳۴۵۶۷۸۹۰");
    expect(toFa("EL-10248")).toBe("EL-۱۰۲۴۸");
  });

  it("leaves non-digit characters untouched", () => {
    expect(toFa("تومان")).toBe("تومان");
    expect(toFa("")).toBe("");
  });
});

describe("formatNumber", () => {
  it("groups with fa-IR separators and Persian digits", () => {
    expect(formatNumber(1_480_000)).toBe("۱٬۴۸۰٬۰۰۰");
    expect(formatNumber(0)).toBe("۰");
  });

  it("never emits Latin digits", () => {
    expect(formatNumber(9_876_543_210)).not.toMatch(/[0-9]/);
  });
});

describe("formatToman", () => {
  it("appends the Toman suffix to the grouped amount", () => {
    expect(formatToman(1_490_000)).toBe("۱٬۴۹۰٬۰۰۰ تومان");
  });

  it("keeps the suffix for zero", () => {
    expect(formatToman(0)).toBe("۰ تومان");
  });
});

describe("formatDate", () => {
  it("renders a Persian date string without Latin digits", () => {
    const text = formatDate("2026-09-19T09:10:00.000Z");
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/[0-9]/);
    expect(text).toMatch(/[۰-۹]/);
  });
});
