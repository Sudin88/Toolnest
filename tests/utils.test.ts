import { describe, expect, it } from "vitest";

import { formatBytes, formatNumber, slugify } from "@/lib/utils";

describe("formatBytes", () => {
  it("keeps sub-kilobyte sizes in bytes", () => {
    expect(formatBytes(1)).toBe("1 B");
    expect(formatBytes(612)).toBe("612 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("shows one decimal below ten of a unit", () => {
    expect(formatBytes(1362)).toBe("1.3 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("drops the decimal at ten and above", () => {
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(10240)).toBe("10 KB");
    expect(formatBytes(1500000)).toBe("1.4 MB");
  });

  it("handles the edges", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
  });
});

describe("formatNumber", () => {
  it("groups thousands", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("slugify", () => {
  it("reduces arbitrary text to a URL-safe slug", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
    expect(slugify("  Crème Brûlée  ")).toBe("creme-brulee");
  });
});
