import {
  FaEyeDropper,
  FaFileArrowUp,
  FaFileCode,
  FaMaximize,
  FaMinimize,
  FaRightLeft,
} from "react-icons/fa6";

import type { ToolDefinition } from "@/lib/tools/types";

export const imageTools: ToolDefinition[] = [
  {
    slug: "compress-image",
    name: "Compress Image",
    category: "image",
    tagline: "Shrink a photo and see exactly what it saved",
    description:
      "Reduce the file size of a JPEG, PNG or WebP image with a quality control, and compare the original and compressed sizes side by side.",
    icon: FaMinimize,
    metaTitle: "Compress Image Without Uploading: JPG, PNG, WebP",
    keywords: [
      "compress image",
      "reduce image size",
      "image compressor",
      "optimise jpeg",
      "compress image without uploading",
      "shrink a photo in the browser",
    ],
    local: true,
    status: "live",
    rank: 94,
    added: "2026-08-05",
    howTo: [
      "Drop in an image, or click to choose one.",
      "Set the quality level. 70 to 80 percent is usually indistinguishable from the original at a fraction of the size.",
      "Optionally cap the longest edge. Most savings on photographs come from reducing dimensions rather than quality.",
      "Compare the before and after byte counts, then download the result if it is genuinely smaller.",
    ],
    faqs: [
      {
        q: "Is my photo uploaded?",
        a: "No. The image is decoded and re-encoded by the Canvas API inside your browser. Nothing is transmitted.",
      },
      {
        q: "Will compressing reduce the image dimensions?",
        a: "Only if you set a maximum edge length. At 100 percent quality with no resize, the pixel dimensions are unchanged and only the encoding changes.",
      },
      {
        q: "Why did my PNG get larger?",
        a: "PNG is lossless, so re-encoding it rarely helps and a quality setting does nothing. Convert to JPEG or WebP first if the image is a photograph. The tool tells you when the output is bigger and lets you keep the original.",
      },
      {
        q: "Can I compress a transparent PNG?",
        a: "Yes, but keep it as PNG to preserve transparency. For transparent images the savings come almost entirely from resizing.",
      },
    ],
    limits: [
      "Output is JPEG, PNG or WebP only; other formats must be converted first.",
      "There is no way to hit an exact target size. The quality control reduces size by degrees.",
      "Large images are decoded into memory in full, so very large files depend on how much RAM your browser has available.",
    ],
  },
  {
    slug: "resize-image",
    name: "Resize Image",
    category: "image",
    tagline: "Exact pixels or percentages, aspect ratio locked",
    description:
      "Resize an image to an exact width and height or by percentage, with the aspect ratio locked by default and several resampling grades.",
    icon: FaMaximize,
    metaTitle: "Resize Image Without Uploading: Exact Pixels",
    keywords: [
      "resize image",
      "image resizer",
      "change image dimensions",
      "scale image pixel",
      "resize image without uploading",
      "resize photo to exact size",
    ],
    local: true,
    status: "live",
    rank: 90,
    added: "2026-08-08",
    howTo: [
      "Load an image and note its current dimensions.",
      "Type a new width or height. With the aspect ratio locked the other value follows automatically.",
      "Switch the lock off when a system demands exact dimensions and you are willing to crop or stretch.",
      "Choose a resampling grade: high quality costs a little more time and produces smoother edges when enlarging.",
      "Download the resized image.",
    ],
    faqs: [
      {
        q: "What happens to image quality when I enlarge?",
        a: "Enlarging cannot invent detail. Smooth resampling avoids the worst jaggedness, but the result will look softer than a native image at that size.",
      },
      {
        q: "Does resizing lose metadata such as EXIF?",
        a: "Yes. Re-encoding through the Canvas API writes a new file with no EXIF block, which means camera details and GPS coordinates are removed. That is usually desirable for images you are about to publish.",
      },
      {
        q: "What is the largest image I can process?",
        a: "The practical limit is the browser's maximum canvas area, which is around 16,000 pixels on a side and a total area of roughly 268 megapixels. Larger images are rejected with a clear message rather than failing silently.",
      },
    ],
    limits: [
      "Enlarging interpolates pixels; it cannot add real detail.",
      "Re-encoding drops EXIF and other embedded metadata, including GPS coordinates.",
      "Output is PNG, JPEG or WebP only; the smaller side of the aspect ratio can be rounded by a pixel.",
    ],
  },
  {
    slug: "convert-image",
    name: "Convert Image",
    category: "image",
    tagline: "JPEG, PNG and WebP in either direction",
    description:
      "Convert an image between JPEG, PNG and WebP, with a quality control for the lossy formats and a preview of the size trade-off.",
    icon: FaRightLeft,
    metaTitle: "Convert Image Without Uploading: JPG, PNG, WebP",
    keywords: [
      "image converter",
      "jpg to png",
      "png to webp",
      "convert image format",
      "convert image without uploading",
      "webp converter online",
    ],
    local: true,
    status: "live",
    rank: 88,
    added: "2026-08-08",
    howTo: [
      "Load an image. Its format is detected from the file itself, not from the extension.",
      "Choose the output format.",
      "Adjust quality for JPEG and WebP; PNG ignores it.",
      "Check the resulting size, then download.",
    ],
    faqs: [
      {
        q: "Which format should I use?",
        a: "JPEG for photographs, PNG when you need transparency or lossless detail such as screenshots and line art, WebP when you want the best size for a website and can rely on modern browsers.",
      },
      {
        q: "What happens to transparency when converting to JPEG?",
        a: "JPEG has no alpha channel, so transparent areas are filled with white. The tool warns you before you convert rather than producing a surprising result.",
      },
      {
        q: "Does converting to PNG increase the file size?",
        a: "Usually, yes, and sometimes substantially. PNG is lossless, so it stores every pixel exactly. It is the right choice for transparency, not for shrinking a photo.",
      },
    ],
    limits: [
      "Formats are limited to JPEG, PNG and WebP. SVG, HEIC and TIFF cannot be produced.",
      "An animated GIF or WebP is converted from its first frame only; the animation is not preserved.",
      "Colour profiles are not carried over, so the output may look slightly different in a colour-managed viewer.",
    ],
  },
  {
    slug: "image-to-pdf",
    name: "Image to PDF",
    category: "image",
    tagline: "One image into a clean, correctly sized page",
    description:
      "Turn a single image into a PDF page, choosing the paper size, orientation, fit mode and margin rather than settling for a default.",
    icon: FaFileArrowUp,
    metaTitle: "Image to PDF Without Uploading: Free Converter",
    keywords: [
      "image to pdf",
      "jpg to pdf",
      "png to pdf",
      "convert picture to pdf",
      "image to pdf without uploading",
      "photo to pdf a4",
    ],
    local: true,
    status: "live",
    rank: 82,
    added: "2026-08-10",
    howTo: [
      "Load an image and check the preview.",
      "Pick a paper size, A4 or Letter, or choose a page that matches the image exactly.",
      "Choose whether the image should fit inside the page or fill it, and set the margin.",
      "Download the PDF. It is built in the browser, so the image is never uploaded.",
    ],
    faqs: [
      {
        q: "Can I put several images into one PDF?",
        a: "Use Images to PDF instead. It accepts a list and produces one document with a page per image, including a caption option.",
      },
      {
        q: "Why is the image blurry in the PDF?",
        a: "The image was embedded at its original resolution but displayed larger than it can support. For a print-quality page you need roughly 300 pixels per inch, so an A4 page wants about 2,480 pixels across.",
      },
      {
        q: "Is the resulting PDF searchable?",
        a: "No. The page contains a picture of text, not text, so nothing can select or search it. Use a document scanner with OCR if that matters.",
      },
    ],
    limits: [
      "One image per document. For several images use Images to PDF.",
      "There is no OCR, so the text on the page is not selectable or searchable.",
      "No encryption, password protection or digital signature can be applied.",
    ],
  },
  {
    slug: "image-color-picker",
    name: "Image Colour Picker",
    category: "image",
    tagline: "Pick exact colours and copy HEX, RGB or HSL",
    description:
      "Pick colours from any image and copy the value as HEX, RGB or HSL, with magnified sampling so you can target a single pixel accurately.",
    icon: FaEyeDropper,
    metaTitle: "Pick Colours From an Image: HEX, RGB, HSL",
    keywords: [
      "color picker from image",
      "eyedropper online",
      "hex color from image",
      "pick color from photo",
      "colour picker from image",
      "get hex code from image",
    ],
    local: true,
    status: "live",
    rank: 72,
    added: "2026-08-15",
    howTo: [
      "Load an image. It is drawn at a size that fits the window while retaining full pixel data.",
      "Move the pointer over the image to sample. The zoom panel shows the pixels around the cursor.",
      "Click to lock a colour. The HEX, RGB and HSL values appear with a copy button for each.",
      "Keep up to twelve swatches, then copy the whole palette at once when you are building a scheme.",
    ],
    faqs: [
      {
        q: "Does scaling the image affect the colours I pick?",
        a: "No. Sampling reads the original pixel data, so a colour picked from a scaled-down preview is the true value from the source file.",
      },
      {
        q: "Which colour format should I use?",
        a: "HEX for CSS and design tools, RGB where you need to set a channel numerically, and HSL when you want to reason about hue, saturation and lightness separately.",
      },
      {
        q: "Can I upload a PDF or a screenshot?",
        a: "Any image format your browser can display works, including PNG and JPEG screenshots. PDF pages are not images, so export the page first.",
      },
    ],
    limits: [
      "Images over about 24 megapixels are sampled at reduced resolution to keep the page responsive.",
      "Values come from the decoded pixels, so an embedded colour profile is ignored and the numbers may differ from a colour-managed editor.",
      "Sampling reads single pixels; there is no averaging over a region.",
    ],
  },
  {
    slug: "image-to-base64",
    name: "Image to Base64",
    category: "image",
    tagline: "Inline an image as a data URI",
    description:
      "Convert an image into a base64 data URI for CSS or HTML, and see the size cost of inlining it before you commit to it.",
    icon: FaFileCode,
    metaTitle: "Image to Base64: Data URI Generator",
    keywords: [
      "image to base64",
      "data uri generator",
      "base64 image",
      "inline image css",
      "convert image to base64 online",
      "png to base64",
    ],
    local: true,
    status: "live",
    rank: 66,
    added: "2026-08-18",
    howTo: [
      "Drop in an image file.",
      "Watch the size comparison: base64 inflates a file by roughly a third, which is the number that matters.",
      "Copy the ready-to-use CSS value or the raw base64 string, depending on where it is going.",
    ],
    faqs: [
      {
        q: "When should I inline an image?",
        a: "For very small icons that would otherwise cost a network round trip (under roughly two kilobytes). Beyond that the extra bytes in every page load cost more than the request they save.",
      },
      {
        q: "Why is the base64 larger than the original file?",
        a: "Base64 represents three bytes as four characters, which is a fixed 33 percent overhead before any compression.",
      },
    ],
    limits: [
      "The whole file is held in memory as a data URI, so very large images can be slow or may fail.",
      "Base64 cannot be streamed or cached separately. It is re-downloaded with every page that contains it.",
      "There is no gzip on top of it, so the size shown is the size transferred.",
    ],
  },
];
