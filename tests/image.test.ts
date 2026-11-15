import { describe, expect, it } from "vitest";

import { extensionFor, formatLabel, sniffImageType } from "@/lib/image";

describe("extensionFor", () => {
  it("names a download for what the blob actually contains", () => {
    expect(extensionFor("image/jpeg")).toBe("jpg");
    expect(extensionFor("image/png")).toBe("png");
    expect(extensionFor("image/webp")).toBe("webp");
  });

  it("falls back to the subtype when there is no shorter name", () => {
    expect(extensionFor("image/tiff")).toBe("tiff");
  });
});

describe("formatLabel", () => {
  it("prints the format a blob reports", () => {
    expect(formatLabel("image/webp")).toBe("WebP");
    expect(formatLabel("image/jpeg")).toBe("JPEG");
  });
});

describe("sniffImageType", () => {
  it("reads the format from the first bytes rather than the extension", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(sniffImageType(png)).toBe("image/png");
  });

  it("returns null for bytes that match no format it knows", () => {
    expect(sniffImageType(new Uint8Array(16))).toBeNull();
  });
});
