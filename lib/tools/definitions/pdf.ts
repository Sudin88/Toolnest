import {
  FileDown,
  Images,
  Layers,
  Merge,
  RotateCw,
  Scissors,
  Stamp,
} from "lucide-react";

import type { ToolDefinition } from "@/lib/tools/types";

export const pdfTools: ToolDefinition[] = [
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    category: "pdf",
    tagline: "Combine PDFs in the order you choose",
    description:
      "Combine several PDF files into one document, reorder them by dragging, and download the merged file — all without uploading anything.",
    icon: Merge,
    keywords: ["merge pdf", "combine pdf", "join pdf files", "pdf merger"],
    local: true,
    status: "planned",
    rank: 100,
    added: "2026-08-01",
    howTo: [
      "Add two or more PDF files by dropping them onto the panel or using the file picker.",
      "Drag the rows to set the order the documents should appear in. The first file's pages come first.",
      "Check the page total, since that is the fastest way to spot a file you added twice.",
      "Merge, then download. The combined file is assembled in your browser.",
    ],
    faqs: [
      {
        q: "Is there a limit on how many files or pages I can merge?",
        a: "The limit is your device's memory rather than a server quota. In practice a few hundred pages work comfortably on a phone; very large jobs are slower because the whole document is held in memory at once.",
      },
      {
        q: "Do bookmarks and form fields survive the merge?",
        a: "Page content, annotations and links are preserved. Document-level features such as bookmarks and interactive form fields are not carried across, because the output is a new document.",
      },
      {
        q: "What happens if one of my PDFs is password protected?",
        a: "It cannot be read without the password and the merge stops with a message naming the file. Remove the password first, then merge.",
      },
      {
        q: "Is my document uploaded to a server?",
        a: "No. Merging runs in your browser with pdf-lib, so the files never leave your device.",
      },
    ],
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    category: "pdf",
    tagline: "Split by page range or into single pages",
    description:
      "Split a PDF into separate files by page range, by a fixed number of pages, or one file per page, and download them together as a zip.",
    icon: Scissors,
    keywords: ["split pdf", "separate pdf pages", "pdf splitter", "extract pdf range"],
    local: true,
    status: "planned",
    rank: 96,
    added: "2026-08-01",
    howTo: [
      "Load a PDF. The page count and a thumbnail of the first page confirm you have the right file.",
      "Choose a split mode: by range, every N pages, or one file per page.",
      "Check the preview of how many files you will get and which pages land in each.",
      "Split, then download the zip archive.",
    ],
    faqs: [
      {
        q: "How do I write a page range?",
        a: "Use 1-based numbers separated by commas, with a hyphen for a run — for example 1-3, 7, 10-12. Ranges that fall outside the document are reported rather than silently ignored.",
      },
      {
        q: "Why is the output a zip file?",
        a: "Splitting usually produces several documents. A single archive keeps them together instead of firing a dozen downloads at your browser.",
      },
      {
        q: "Does splitting reduce quality?",
        a: "No. Pages are copied between documents rather than re-rendered or re-compressed, so the content is byte-identical to the original.",
      },
    ],
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    category: "pdf",
    tagline: "Turn pages upright, all or just some",
    description:
      "Rotate every page in a PDF by 90, 180 or 270 degrees, or fix only the pages that a scanner saved sideways.",
    icon: RotateCw,
    keywords: ["rotate pdf", "turn pdf pages", "fix sideways pdf", "pdf orientation"],
    local: true,
    status: "planned",
    rank: 86,
    added: "2026-08-03",
    howTo: [
      "Load a PDF and check the orientation preview.",
      "Apply a rotation to all pages, or switch to per-page mode and set each page individually.",
      "Use the preview to confirm the pages now read correctly.",
      "Download the rotated file.",
    ],
    faqs: [
      {
        q: "Does rotating change the page size?",
        a: "No. Rotation is applied to the page's display transform, so the content turns while the page box keeps its dimensions. A mixed-orientation document stays mixed.",
      },
      {
        q: "Can I rotate only some pages?",
        a: "Yes. Switch to per-page mode and each page gets its own rotation control, which is what you need when a scanner has fed one sheet of a batch the wrong way.",
      },
      {
        q: "Why do my rotations not persist in a particular reader?",
        a: "A few readers cache page rendering aggressively. Reopening the file, or a hard refresh, shows the change.",
      },
    ],
  },
  {
    slug: "extract-pdf-pages",
    name: "Extract PDF Pages",
    category: "pdf",
    tagline: "Pull out the pages you need, in any order",
    description:
      "Pull selected pages out of a PDF into a new document — reorder them, duplicate them, or drop the ones you do not need.",
    icon: FileDown,
    keywords: ["extract pdf pages", "pdf page extractor", "delete pdf pages", "reorder pdf pages"],
    local: true,
    status: "planned",
    rank: 84,
    added: "2026-08-03",
    howTo: [
      "Load a PDF and enter the pages you want to keep, for example 3, 1, 1, 7-9.",
      "Check the output preview, which lists the pages in the exact order they will appear.",
      "Extract, then download the new document.",
    ],
    faqs: [
      {
        q: "Can I duplicate a page by naming it twice?",
        a: "Yes. Repeating a page number copies it, so entering 1, 1, 2 produces a document whose first two pages are both the original page one.",
      },
      {
        q: "Is this different from Split PDF?",
        a: "Split produces several files, usually all of them. Extract produces one file containing only the pages you asked for — better when most of the document is not wanted.",
      },
      {
        q: "Do extracted pages keep their links and form fields?",
        a: "Annotations and links are carried across. Interactive form fields are not, because they belong to the document rather than the page.",
      },
    ],
  },
  {
    slug: "watermark-pdf",
    name: "Add PDF Watermark",
    category: "pdf",
    tagline: "Stamp text across some or all pages",
    description:
      "Add a text watermark to a PDF with control over the wording, size, colour, opacity, rotation and which pages it appears on.",
    icon: Stamp,
    keywords: ["pdf watermark", "add watermark to pdf", "stamp pdf", "draft watermark"],
    local: true,
    status: "planned",
    rank: 80,
    added: "2026-08-05",
    howTo: [
      "Load a PDF and type the watermark text, for example CONFIDENTIAL or a document reference.",
      "Set the size and opacity. Watermarks people complain about are usually too opaque, so start around 15 percent.",
      "Choose the rotation and position. Diagonal across the centre is the usual choice for a document that must stay readable.",
      "Limit it to a page range if only part of the document is confidential, then download.",
    ],
    faqs: [
      {
        q: "Does a watermark protect a document?",
        a: "No. It is a visible marking, not a security control — anyone can remove it with the right tool. Use encryption and permissions if you need actual protection.",
      },
      {
        q: "Can I use an image as a watermark?",
        a: "Not currently. Text watermarks only, in the fonts embedded in the app.",
      },
      {
        q: "Will the watermark cover important content?",
        a: "It is drawn on top of the page, so it will. Lower the opacity, reduce the size, or restrict the mark to a margin for a document that must remain legible.",
      },
    ],
  },
  {
    slug: "images-to-pdf",
    name: "Images to PDF",
    category: "pdf",
    tagline: "Many images into one PDF, page per image",
    description:
      "Combine several images into a single PDF with one image per page, choosing paper size, orientation, fit mode, margins and captions.",
    icon: Images,
    keywords: ["images to pdf", "jpg to pdf", "multiple images to pdf", "photo to pdf"],
    local: true,
    status: "planned",
    rank: 88,
    added: "2026-08-10",
    howTo: [
      "Add your images and drag them into the order you want.",
      "Choose a paper size and orientation, or let each page match its image.",
      "Set the fit mode and margin, and add captions if the document needs them.",
      "Build the PDF and download it.",
    ],
    faqs: [
      {
        q: "Should the page match the image or the image match the page?",
        a: "Match the page to the image for a photo album, so nothing is letterboxed. Use a standard paper size when the result will be printed on paper.",
      },
      {
        q: "Are the images re-compressed?",
        a: "JPEG images are embedded as they are, so there is no further quality loss. Other formats are converted, which can change the file size.",
      },
      {
        q: "Can I add page numbers?",
        a: "Captions are supported. Page numbers are not, since the page furniture is drawn onto the page rather than added as a footer field.",
      },
    ],
  },
  {
    slug: "pdf-page-counter",
    name: "PDF Page Counter",
    category: "pdf",
    tagline: "Page count and basic document facts, instantly",
    description:
      "Count the pages in a PDF and read its page sizes, orientation mix, encryption status and embedded metadata without opening a reader.",
    icon: Layers,
    keywords: ["pdf page count", "how many pages in pdf", "pdf information", "count pdf pages"],
    local: true,
    status: "planned",
    rank: 70,
    added: "2026-08-12",
    howTo: [
      "Drop in a PDF. The count appears without any further action.",
      "Check page dimensions and whether the document mixes orientations or sizes.",
      "Expand the metadata section to see the title, author and creation tool recorded in the file, if any.",
      "Load another file to compare — the table keeps a running list.",
    ],
    faqs: [
      {
        q: "Why does the page count differ from what my reader shows?",
        a: "Almost always because a page range is being shown, or because the reader is counting spreads rather than pages. The number here is the count of page objects in the file.",
      },
      {
        q: "Can it open a password-protected PDF?",
        a: "It will report that the file is encrypted and stop, since the page count cannot be known without the password. It will not guess.",
      },
      {
        q: "Does it modify my file?",
        a: "No. The file is read in memory and never written to or uploaded.",
      },
    ],
  },
];
