import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import {
  MAX_PDF_BYTES,
  PDF_PAGE_MAX_PT,
  chunkEvery,
  copyPagesToNewDocument,
  fileStem,
  imagePageGeometry,
  loadPdfDocument,
  looksLikePdf,
  mergePdfs,
  normaliseAngle,
  normalisePages,
  orientationOf,
  parseGroupedRanges,
  parsePageRanges,
  pdfPageCount,
  rotatePdf,
  summarisePdf,
  centredTextPlacement,
  validatePdfFile,
  watermarkPdf,
} from "@/lib/pdf";

/* ------------------------------------------------------------- fixtures */

interface SourcePage {
  width: number;
  height: number;
}

/** Build a real PDF whose pages have distinguishable sizes. */
async function makePdf(
  pages: SourcePage[],
  meta: { title?: string; author?: string } = {},
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const page of pages) doc.addPage([page.width, page.height]);
  if (meta.title) doc.setTitle(meta.title);
  if (meta.author) doc.setAuthor(meta.author);
  return doc.save();
}

const A4 = { width: 595.28, height: 841.89 };

/** Every operation must produce a document a reader can open, so every test
 * round-trips its output back through pdf-lib. */
async function pageSizesOf(bytes: Uint8Array): Promise<SourcePage[]> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((page) => {
    const { width, height } = page.getSize();
    return { width: Math.round(width), height: Math.round(height) };
  });
}

function fileOf(bytes: Uint8Array, name: string): File {
  return new File([bytes as BlobPart], name, { type: "application/pdf" });
}

/* ----------------------------------------------------------- validation */

describe("looksLikePdf", () => {
  it("accepts a real PDF header", async () => {
    expect(looksLikePdf(await makePdf([A4]))).toBe(true);
  });

  it("rejects a text file that merely uses the .pdf name", () => {
    expect(looksLikePdf(new TextEncoder().encode("hello, not a pdf at all"))).toBe(false);
  });

  it("accepts a header that appears after a little preamble", () => {
    const bytes = new Uint8Array(64);
    bytes.set(new TextEncoder().encode("%PDF-1.7"), 10);
    expect(looksLikePdf(bytes)).toBe(true);
  });
});

describe("validatePdfFile", () => {
  it("passes a well-formed file", () => {
    expect(validatePdfFile(fileOf(new Uint8Array([1, 2, 3]), "report.pdf"))).toBeNull();
  });

  it("rejects the wrong extension", () => {
    expect(validatePdfFile(fileOf(new Uint8Array([1]), "report.docx"))).toContain("not a PDF");
  });

  it("rejects an empty file", () => {
    expect(validatePdfFile(fileOf(new Uint8Array(0), "empty.pdf"))).toContain("empty");
  });

  it("rejects a file over the size limit", () => {
    const big = fileOf(new Uint8Array(1), "big.pdf");
    Object.defineProperty(big, "size", { value: MAX_PDF_BYTES + 1 });
    expect(validatePdfFile(big)).toContain("larger than");
  });
});

/* ---------------------------------------------------------- page ranges */

describe("parsePageRanges", () => {
  it("reads a mixed list in the order written, duplicates kept", () => {
    const result = parsePageRanges("3, 1, 1, 7-9", 10);
    expect(result.pages).toEqual([3, 1, 1, 7, 8, 9]);
    expect(result.errors).toEqual([]);
  });

  it("swaps a backwards range rather than rejecting it", () => {
    expect(parsePageRanges("7-5", 10).pages).toEqual([5, 6, 7]);
  });

  it("accepts commas, spaces and newlines as separators", () => {
    expect(parsePageRanges("1-2\n 4 , 6", 10).pages).toEqual([1, 2, 4, 6]);
  });

  it("reports a token that is not a number", () => {
    const result = parsePageRanges("one", 5);
    expect(result.pages).toEqual([]);
    expect(result.errors[0]).toContain("not a page number");
  });

  it("reports page 0 rather than treating it as page 1", () => {
    const result = parsePageRanges("0", 5);
    expect(result.pages).toEqual([]);
    expect(result.errors[0]).toContain("start at 1");
  });

  it("reports a range past the end, keeping the pages that do exist", () => {
    const result = parsePageRanges("8-12", 10);
    expect(result.pages).toEqual([8, 9, 10]);
    expect(result.errors[0]).toContain("out of range");
  });

  it("reports a start past the end", () => {
    const result = parsePageRanges("11", 10);
    expect(result.pages).toEqual([]);
    expect(result.errors[0]).toContain("out of range");
  });

  it("uses the singular when the document has one page", () => {
    expect(parsePageRanges("2", 1).errors[0]).toContain("1 page");
  });

  it("ignores an empty list entirely", () => {
    expect(parsePageRanges("   ", 10)).toEqual({ pages: [], errors: [] });
  });
});

describe("normalisePages", () => {
  it("dedupes and sorts", () => {
    expect(normalisePages([5, 1, 5, 3])).toEqual([1, 3, 5]);
  });
});

describe("chunkEvery", () => {
  it("chunks evenly with a short final group", () => {
    expect(chunkEvery(10, 4)).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10],
    ]);
  });

  it("produces one group per page at size 1", () => {
    expect(chunkEvery(3, 1)).toEqual([[1], [2], [3]]);
  });

  it("treats a nonsensical size as 1 rather than looping forever", () => {
    expect(chunkEvery(2, 0)).toEqual([[1], [2]]);
  });
});

describe("parseGroupedRanges", () => {
  it("splits on semicolons and newlines, one group per file", () => {
    const result = parseGroupedRanges("1-3; 4\n5-8", 8);
    expect(result.groups).toEqual([[1, 2, 3], [4], [5, 6, 7, 8]]);
    expect(result.errors).toEqual([]);
  });

  it("normalises order and duplicates within a group", () => {
    expect(parseGroupedRanges("5-3, 3", 8).groups).toEqual([[3, 4, 5]]);
  });

  it("skips blank groups", () => {
    expect(parseGroupedRanges("1; ; 2", 5).groups).toEqual([[1], [2]]);
  });

  it("surfaces a bad group without discarding the good ones", () => {
    const result = parseGroupedRanges("1; nope", 5);
    expect(result.groups).toEqual([[1]]);
    expect(result.errors).toHaveLength(1);
  });
});

/* ------------------------------------------------------------- rotation */

describe("normaliseAngle", () => {
  it("wraps negatives and multiples", () => {
    expect(normaliseAngle(-90)).toBe(270);
    expect(normaliseAngle(450)).toBe(90);
    expect(normaliseAngle(180)).toBe(180);
  });
});

describe("orientationOf", () => {
  it("classifies portrait, landscape and square", () => {
    expect(orientationOf(100, 200)).toBe("portrait");
    expect(orientationOf(200, 100)).toBe("landscape");
    expect(orientationOf(100, 100)).toBe("square");
    expect(orientationOf(100, 100.4)).toBe("square");
  });
});

/* ------------------------------------------------------------ watermark */

describe("centredTextPlacement", () => {
  it("anchors a run so its centre lands on the page centre", () => {
    const pageW = 600;
    const pageH = 800;
    const textW = 200;
    const textH = 60;
    const rotation = 45;

    const { x, y } = centredTextPlacement(pageW, pageH, textW, textH, rotation);
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // pdf-lib rotates about the anchor, so the run's centre is the anchor plus
    // half the rotated bounding box.
    expect(x + (textW * cos - textH * sin) / 2).toBeCloseTo(pageW / 2, 6);
    expect(y + (textW * sin + textH * cos) / 2).toBeCloseTo(pageH / 2, 6);
  });

  it("is exact for a flat run", () => {
    const placement = centredTextPlacement(600, 800, 200, 60, 0);
    expect(placement.x).toBeCloseTo(200, 6);
    expect(placement.y).toBeCloseTo(370, 6);
  });
});

/* --------------------------------------------------------- image layout */

describe("imagePageGeometry", () => {
  it("fits a square image inside a portrait A4 page", () => {
    const geometry = imagePageGeometry({
      imageWidth: 1000,
      imageHeight: 1000,
      pageSize: "a4",
      orientation: "portrait",
      fit: "contain",
      marginMm: 0,
    });

    expect(geometry.pageW).toBeCloseTo(595.28, 2);
    expect(geometry.pageH).toBeCloseTo(841.89, 2);
    expect(geometry.drawW).toBeCloseTo(595.28, 2);
    expect(geometry.drawH).toBeCloseTo(595.28, 2);
    expect(geometry.x).toBeCloseTo(0, 2);
    expect(geometry.y).toBeCloseTo((841.89 - 595.28) / 2, 2);
    expect(geometry.cropped).toBe(false);
  });

  it("turns the page when the image is wider than it is tall, in auto mode", () => {
    const geometry = imagePageGeometry({
      imageWidth: 1000,
      imageHeight: 500,
      pageSize: "letter",
      orientation: "auto",
      fit: "contain",
      marginMm: 0,
    });

    expect(geometry.pageW).toBeCloseTo(792, 2);
    expect(geometry.pageH).toBeCloseTo(612, 2);
  });

  it("keeps the margin from shrinking the page in match mode", () => {
    const geometry = imagePageGeometry({
      imageWidth: 200,
      imageHeight: 100,
      pageSize: "match",
      orientation: "portrait",
      fit: "contain",
      marginMm: 10,
    });

    expect(geometry.pageW).toBeCloseTo(200, 4);
    expect(geometry.pageH).toBeCloseTo(100, 4);
    expect(geometry.drawW).toBeCloseTo(200, 4);
    expect(geometry.x).toBeCloseTo(0, 4);
    expect(geometry.y).toBeCloseTo(0, 4);
  });

  it("flags the crop when filling a page with a mismatched aspect ratio", () => {
    const geometry = imagePageGeometry({
      imageWidth: 1000,
      imageHeight: 500,
      pageSize: "a4",
      orientation: "portrait",
      fit: "fill",
      marginMm: 0,
    });

    expect(geometry.cropped).toBe(true);
    expect(geometry.drawW).toBeGreaterThan(geometry.pageW);
    expect(geometry.drawH).toBeCloseTo(geometry.pageH, 2);
  });

  it("does not flag a crop when fitting inside", () => {
    const geometry = imagePageGeometry({
      imageWidth: 1000,
      imageHeight: 500,
      pageSize: "a4",
      orientation: "portrait",
      fit: "contain",
      marginMm: 0,
    });

    expect(geometry.cropped).toBe(false);
    expect(geometry.drawW).toBeLessThanOrEqual(geometry.pageW + 0.5);
  });

  it("clamps an enormous image to the PDF page box without distorting it", () => {
    const geometry = imagePageGeometry({
      imageWidth: 20_000,
      imageHeight: 10_000,
      pageSize: "match",
      orientation: "portrait",
      fit: "contain",
      marginMm: 0,
    });

    expect(geometry.pageW).toBeCloseTo(PDF_PAGE_MAX_PT, 2);
    expect(geometry.pageH).toBeCloseTo(PDF_PAGE_MAX_PT / 2, 2);
    expect(geometry.drawW / geometry.drawH).toBeCloseTo(2, 6);
  });

  it("survives a margin larger than the page", () => {
    const geometry = imagePageGeometry({
      imageWidth: 100,
      imageHeight: 100,
      pageSize: "a4",
      orientation: "portrait",
      fit: "contain",
      marginMm: 500,
    });

    expect(geometry.drawW).toBeGreaterThan(0);
    expect(Number.isFinite(geometry.x)).toBe(true);
  });
});

/* ------------------------------------------------------------- naming */

describe("fileStem", () => {
  it("drops the extension", () => {
    expect(fileStem("report.final.pdf")).toBe("report.final");
  });

  it("falls back when there is nothing left", () => {
    expect(fileStem(".pdf")).toBe("document");
  });
});

/* ---------------------------------------------------- document loading */

describe("loadPdfDocument", () => {
  it("opens a real document", async () => {
    const doc = await loadPdfDocument(await makePdf([A4]));
    expect(doc.getPageCount()).toBe(1);
  });

  it("explains a missing %PDF- header", async () => {
    await expect(loadPdfDocument(new TextEncoder().encode("nope"))).rejects.toThrow(/%PDF-/);
  });

  it("explains a corrupt file that has the header", async () => {
    const bytes = new TextEncoder().encode("%PDF-1.7 then some rubbish");
    await expect(loadPdfDocument(bytes)).rejects.toThrow(/corrupt|could not be read/i);
  });
});

/* ------------------------------------------------------- pdf-lib ops */

describe("pdfPageCount", () => {
  it("counts the pages", async () => {
    expect(await pdfPageCount(await makePdf([A4, A4, A4]))).toBe(3);
  });
});

describe("mergePdfs", () => {
  it("keeps every page and respects the order of the entries", async () => {
    const first = await makePdf([{ width: 100, height: 100 }]);
    const second = await makePdf([
      { width: 200, height: 200 },
      { width: 300, height: 300 },
    ]);

    const merged = await mergePdfs([
      { name: "a.pdf", bytes: first },
      { name: "b.pdf", bytes: second },
    ]);

    expect(await pageSizesOf(merged)).toEqual([
      { width: 100, height: 100 },
      { width: 200, height: 200 },
      { width: 300, height: 300 },
    ]);
  });

  it("moves a document when the entry order changes", async () => {
    const small = await makePdf([{ width: 100, height: 100 }]);
    const large = await makePdf([{ width: 400, height: 400 }]);

    const merged = await mergePdfs([
      { name: "large.pdf", bytes: large },
      { name: "small.pdf", bytes: small },
    ]);

    expect(await pageSizesOf(merged)).toEqual([
      { width: 400, height: 400 },
      { width: 100, height: 100 },
    ]);
  });
});

describe("copyPagesToNewDocument", () => {
  it("extracts pages in the order asked for, duplicating on request", async () => {
    const source = await makePdf([
      { width: 100, height: 100 },
      { width: 200, height: 200 },
      { width: 300, height: 300 },
    ]);

    const out = await copyPagesToNewDocument(source, [3, 1, 1]);

    expect(await pageSizesOf(out)).toEqual([
      { width: 300, height: 300 },
      { width: 100, height: 100 },
      { width: 100, height: 100 },
    ]);
  });

  it("leaves the source untouched", async () => {
    const source = await makePdf([A4, A4]);
    await copyPagesToNewDocument(source, [1]);
    expect(await pdfPageCount(source)).toBe(2);
  });
});

describe("rotatePdf", () => {
  async function anglesOf(bytes: Uint8Array): Promise<number[]> {
    const doc = await PDFDocument.load(bytes);
    return doc.getPages().map((page) => page.getRotation().angle);
  }

  it("adds the delta to each page's existing rotation", async () => {
    const source = await makePdf([A4, A4, A4]);
    const out = await rotatePdf(source, [90, 0, 270]);
    expect(await anglesOf(out)).toEqual([90, 0, 270]);
  });

  it("wraps past 360 instead of storing an impossible angle", async () => {
    const source = await makePdf([A4]);
    const out = await rotatePdf(source, [270]);
    const again = await rotatePdf(out, [180]);
    expect(await anglesOf(again)).toEqual([90]);
  });

  it("keeps the page size, since rotation is a display transform", async () => {
    const source = await makePdf([A4]);
    const out = await rotatePdf(source, [90]);
    const [size] = await pageSizesOf(out);
    expect(size.width).toBeCloseTo(595, 0);
    expect(size.height).toBeCloseTo(842, 0);
  });

  it("treats a missing delta as no rotation", async () => {
    const source = await makePdf([A4, A4]);
    const out = await rotatePdf(source, [90]);
    expect(await anglesOf(out)).toEqual([90, 0]);
  });
});

describe("watermarkPdf", () => {
  const options = {
    text: "CONFIDENTIAL",
    size: 48,
    opacity: 0.15,
    rotationDeg: 45,
    color: { r: 0.85, g: 0.19, b: 0.14 },
  };

  it("produces a document that still opens, with every page intact", async () => {
    const source = await makePdf([A4, A4, A4]);
    const out = await watermarkPdf(source, options);
    expect(await pdfPageCount(out)).toBe(3);
  });

  it("changes the bytes, so the mark really was drawn", async () => {
    const source = await makePdf([A4]);
    const out = await watermarkPdf(source, options);
    expect(Buffer.from(out).equals(Buffer.from(source))).toBe(false);
  });

  it("accepts a page subset", async () => {
    const source = await makePdf([A4, A4, A4]);
    const out = await watermarkPdf(source, { ...options, pages: [2] });
    expect(await pdfPageCount(out)).toBe(3);
  });

  it("rejects an empty document gracefully rather than throwing", async () => {
    const source = await makePdf([]);
    await expect(watermarkPdf(source, options)).resolves.toBeInstanceOf(Uint8Array);
  });
});

describe("summarisePdf", () => {
  it("reports a uniform document", async () => {
    const summary = await summarisePdf(await makePdf([A4, A4], { title: "Report", author: "A. Writer" }));
    expect(summary.pageCount).toBe(2);
    expect(summary.orientation).toBe("portrait");
    expect(summary.mixedSizes).toBe(false);
    expect(summary.title).toBe("Report");
    expect(summary.author).toBe("A. Writer");
  });

  it("detects mixed page sizes and orientations", async () => {
    const summary = await summarisePdf(
      await makePdf([
        { width: 595, height: 842 },
        { width: 842, height: 595 },
      ]),
    );
    expect(summary.mixedSizes).toBe(true);
    expect(summary.orientation).toBe("mixed");
  });

  it("returns null metadata rather than empty strings", async () => {
    const summary = await summarisePdf(await makePdf([A4]));
    expect(summary.title).toBeNull();
    expect(summary.author).toBeNull();
  });
});

/* ------------------------------------------------ the split archive path */

describe("split archive", () => {
  it("round-trips the parts through a zip, each one a readable PDF", async () => {
    const source = await makePdf([
      { width: 100, height: 100 },
      { width: 200, height: 200 },
      { width: 300, height: 300 },
    ]);

    const groups = chunkEvery(3, 2);
    const zip = new JSZip();
    for (const pages of groups) {
      const bytes = await copyPagesToNewDocument(source, pages);
      zip.file(`part-${pages[0]}.pdf`, bytes);
    }
    const zipped = await zip.generateAsync({ type: "uint8array" });

    const reopened = await JSZip.loadAsync(zipped);
    const names = Object.keys(reopened.files).sort();
    expect(names).toEqual(["part-1.pdf", "part-3.pdf"]);

    for (const name of names) {
      const bytes = await reopened.file(name)!.async("uint8array");
      expect(looksLikePdf(bytes)).toBe(true);
      expect(await pageSizesOf(bytes)).toHaveLength(name === "part-1.pdf" ? 2 : 1);
    }
  });
});
