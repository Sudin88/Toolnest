import type { Guide } from "@/lib/guides/types";

export const imageGuides: Guide[] = [
  {
    slug: "compress-an-image-for-email",
    title: "How to compress an image for email without losing visible quality",
    metaTitle: "Compress an Image for Email Without Losing Quality",
    description:
      "Bring a photograph under an email's size limit by resizing and compressing it in the browser, and see the result next to the original before you send.",
    updated: "2026-11-12",
    topic: "Images",
    tools: ["compress-image", "resize-image", "convert-image"],
    intro: [
      "An attachment limit around 25 megabytes sounds generous until you attach five photographs from a recent phone. Each one might be 4 to 6 megabytes, and all of them are far larger than any screen will ever show them.",
      "Two changes fix it: reduce the dimensions to what the recipient will actually look at, then compress what is left. Done in that order, a photograph can drop to a few hundred kilobytes with no difference you can see at the size it will be viewed.",
    ],
    sections: [
      {
        id: "why-phone-photos-are-large",
        heading: "Why phone photos are so large",
        body: [
          "A modern phone camera captures much more detail than a screen can display. A twelve-megapixel photograph is around 4000 pixels wide; a laptop screen shows perhaps 1400 of them, and a mail client's preview pane far fewer. The extra pixels are real data, and email carries every one.",
          "That gap is the opportunity. Shrinking a 4000-pixel image to 1600 pixels removes most of the data before compression is even considered, and at the size the photograph will be seen the loss is invisible.",
        ],
        tool: "resize-image",
      },
      {
        id: "resize-then-compress",
        heading: "Resizing then compressing, in order",
        steps: [
          "Resize first. Set the width to roughly what the image will be shown at, around 1600 pixels for a photograph someone will open full screen, or 800 for one that lives inside an email.",
          "Keep the aspect ratio locked so nothing is stretched, and set one dimension only, letting the other follow.",
          "Compress second. Start at quality 80 and step down until you can see a difference, then go back one step.",
          "Compare the original and the result before downloading, so you are judging the real image rather than guessing at it.",
          "Download and attach the result, and keep the original somewhere. The compressed copy is for sending, not for safekeeping.",
        ],
        tool: "compress-image",
      },
      {
        id: "choosing-a-quality-setting",
        heading: "Choosing a quality setting you can justify",
        body: [
          "The quality number is a compression dial rather than a percentage of visible quality, and the useful range is narrower than it looks. Between 70 and 85 most photographs are indistinguishable from the original. Below 60, skin tones begin to smear and backgrounds go blocky. Above 90 the file grows quickly for a difference you will not see.",
          "There is no universal best number, because it depends on the photograph. A portrait with smooth skin compresses well; a detailed landscape or an image with fine text does not. That is why the side-by-side comparison matters more than any recommended default.",
        ],
        bullets: [
          "85 or above: near-archival, still a large file, rarely worth it for email.",
          "75 to 85: the usual sweet spot for photographs.",
          "60 to 75: fine for images shown small, such as a thumbnail inside a message.",
          "Below 60: visible artefacts on most photographs, use only when a size limit forces it.",
        ],
      },
      {
        id: "when-it-is-still-too-large",
        heading: "When the file still needs to be smaller",
        body: [
          "If resizing and compressing have not brought the file under the limit, there are a few more levers, roughly in order of how much they help.",
        ],
        bullets: [
          "Reduce the dimensions further. Halving the width cuts the pixel count to a quarter and matters more than the quality dial.",
          "Change the format. WebP is usually smaller than JPG at the same visible quality, and everything current opens it.",
          "Split the images across two emails, which beats one message that bounces.",
          "Send a link instead of an attachment for anything large or numerous, keeping attachments for one or two images.",
        ],
        tool: "convert-image",
      },
      {
        id: "checking-before-you-send",
        heading: "Checking the result before you send it",
        body: [
          "Open the compressed file at the size the recipient will see it. Zoomed to fit a laptop screen, a good compression is invisible. Zoomed to 400 percent it will look soft, and that is expected, because you are examining pixels that will never be displayed.",
          "Send yourself one test message. Attachment limits are applied by your server and by the recipient's, and the only reliable test of whether a file gets through is to send it.",
        ],
      },
    ],
    faqs: [
      {
        q: "What size should an email attachment be?",
        a: "Many providers cap a whole message at around 25 megabytes, and the encoding used for attachments adds roughly a third to the file size. Keeping the total under 10 megabytes is comfortable, and a compressed photograph is usually well under one.",
      },
      {
        q: "Does compressing an image reduce its dimensions?",
        a: "Not on its own. Compression changes how efficiently the pixels are stored, not how many there are. To make an image smaller on screen as well as on disk, resize it too.",
      },
      {
        q: "Will the recipient notice the quality loss?",
        a: "Not at normal viewing size, if you stayed in the 75 to 85 range and resized sensibly. They will notice only if they zoom in hard or print the image large.",
      },
      {
        q: "Does compressing an image upload it?",
        a: "A local tool does not. The image is decoded and re-encoded in your browser, so a picture of a document or a person is never sent anywhere. You can confirm that in the Network tab, or by disconnecting and trying anyway.",
      },
      {
        q: "Can I compress several images at once?",
        a: "Yes. A batch tool takes a set of files and applies the same settings to all of them, which is the quickest way to bring a folder of holiday photographs under a limit.",
      },
    ],
  },
  {
    slug: "jpg-png-or-webp",
    title: "JPG, PNG or WebP: which format should you use?",
    metaTitle: "JPG vs PNG vs WebP: Which Format to Use",
    description:
      "A practical guide to picking an image format: when JPG wins, when PNG is worth the size, where WebP fits, and how to convert between them in the browser.",
    updated: "2026-11-12",
    topic: "Images",
    tools: ["convert-image", "compress-image", "image-to-base64"],
    intro: [
      "The format you choose sets the file size before you have done anything else. A photograph saved as PNG can be ten times heavier than the same photograph saved as JPG, and a screenshot saved as JPG picks up fuzzy text that nothing later will fix.",
      "The rule is short. Photographs use JPG, flat graphics and anything with transparency use PNG, and the web increasingly uses WebP for both. The rest of this guide is the reasoning behind it.",
    ],
    sections: [
      {
        id: "jpg",
        heading: "JPG: photographs and anything photographic",
        body: [
          "JPG discards detail the eye is unlikely to miss, which is the right trade for a photograph and the wrong one for text. It handles millions of colours well and compresses continuous tone, such as skin, sky and foliage, very efficiently.",
          "Two things to know. It has no transparency, so a logo with a transparent background becomes a white box. And it is lossy, so opening a JPG, editing it and saving it again loses a little more each time. Save once, from the original, at the size you need.",
        ],
        bullets: [
          "Best for: photographs, scanned pages you do not need to search, images with smooth gradients.",
          "Avoid for: screenshots, line art, logos, text, anything needing a transparent background.",
          "Quality setting: 70 to 80 is the usual sweet spot, and above 90 the file grows fast for a difference you cannot see.",
        ],
        tool: "convert-image",
      },
      {
        id: "png",
        heading: "PNG: graphics, text and transparency",
        body: [
          "PNG compresses without losing anything, so a seventh save is identical to the first. That is what makes it the right choice for screenshots, charts, logos and diagrams, where a blurred edge is noticeable and the text has to stay crisp.",
          "The cost is size. A photograph saved as PNG can be many times larger than the JPG version for no visible gain, because PNG was not built for photographic detail. Use it where the content is graphic and sharpness matters, and use JPG or WebP where it is photographic.",
        ],
        bullets: [
          "Best for: screenshots, user interfaces, logos, icons, charts, anything with transparency.",
          "Avoid for: photographs, which it stores faithfully but very heavily.",
          "Watch for: a screenshot with a photograph inside it, where no single format is perfect and WebP often balances both.",
        ],
      },
      {
        id: "webp",
        heading: "WebP: the modern default for the web",
        body: [
          "WebP does both jobs. It offers lossy compression competitive with JPG and lossless compression competitive with PNG, with transparency and animation supported in each mode. For a website it usually produces the smaller file, which is why most performance advice now recommends it.",
          "Two caveats. Very old software may not open it, though every current browser and most modern image editors do. And it is a web format first: if the file is going into a print workflow or an old desktop application, JPG or PNG avoids a compatibility question.",
        ],
        bullets: [
          "Best for: images on a website, where the smaller file means a faster page.",
          "Avoid for: print workflows and old tools that predate it.",
        ],
        tool: "convert-image",
      },
      {
        id: "format-then-size",
        heading: "Match the format to the job, then fix the size",
        body: [
          "Format is the first decision. Dimensions are the second and often the bigger win. A 4000-pixel photograph displayed at 800 pixels is wasted bytes, and reducing a photograph to the width it will really be shown at usually saves more than any quality setting can.",
          "If the file is still too large after that, compression is the third lever: lower the quality, cap the longest edge, or both. A local compressor shows the original and the result side by side, so you can stop as soon as you can see a difference.",
        ],
        tool: "compress-image",
      },
      {
        id: "converting",
        heading: "Converting between formats",
        body: [
          "Converting in the browser is straightforward. The image is decoded to pixels on your device and re-encoded in the format you pick, then handed back as a download. Nothing is uploaded, so the same file you would rather not send to an unknown server stays with you.",
          "One honest limitation: converting a JPG to PNG cannot recover detail the JPG already discarded. The PNG will be larger and no sharper. Convert in the direction that adds compression, not the one that pretends to add quality.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which format is smallest?",
        a: "For photographs, lossy WebP is usually smallest, then JPG, then PNG. For flat graphics, lossless WebP and PNG are close. The gap is widest on photographs, where PNG can be several times larger than JPG.",
      },
      {
        q: "Should I convert all my images to WebP?",
        a: "For a website, usually yes. For files you send to other people or feed into a print or desktop workflow, JPG and PNG are still the safer choice, because everything opens them.",
      },
      {
        q: "Why is my PNG screenshot so large?",
        a: "PNG stores every pixel exactly, and a screenshot of a complex interface has a lot of pixels changing. Reducing the dimensions, or converting to WebP, usually brings the size down more than anything else.",
      },
      {
        q: "Does converting an image reduce its quality?",
        a: "Converting to a lossless format does not. Converting to lossy JPG or WebP loses a little, and the effect compounds if you convert the same file repeatedly, so always convert from the original.",
      },
    ],
  },
  {
    slug: "pick-a-colour-from-an-image",
    title: "How to pick a colour from an image and get its hex code",
    metaTitle: "How to Pick a Colour From an Image and Get the Hex",
    description:
      "Read an exact hex, RGB or HSL value out of a screenshot or photograph in the browser, and understand why one colour can look different in two places.",
    updated: "2026-11-12",
    topic: "Images",
    tools: ["image-color-picker", "image-to-base64"],
    intro: [
      "The quickest way to match a colour is to sample it rather than guess it. Whether you are rebuilding a palette from a logo, matching a client's existing site, or finding the exact shade of a wall in a photograph, an eyedropper gives you the number instead of an approximation.",
      "A browser colour picker reads the pixel you point at and reports the value in the forms you will actually use: hex for CSS, RGB for design tools, and HSL for adjusting a shade by hand.",
    ],
    sections: [
      {
        id: "sampling-a-colour",
        heading: "Sampling a colour in four steps",
        steps: [
          "Load the image, either by dropping it on the picker or choosing it from your device. Screenshots, PNGs, JPGs and WebP all work.",
          "Click the pixel you want. The picker reads its colour and reports the value.",
          "Copy the format you need. Hex is what CSS wants, RGB suits design tools, and HSL is easiest to adjust by hand.",
          "Sample two or three points if the area is textured or has a gradient, then keep the one that reads correctly next to the rest of the design.",
        ],
        tool: "image-color-picker",
      },
      {
        id: "formats",
        heading: "Hex, RGB and HSL, and when each one helps",
        body: [
          "All three describe the same pixel. What separates them is which one makes your next step easier.",
        ],
        bullets: [
          "Hex, such as #1f6feb, is the compact form the web uses. It is a string, which makes it convenient in CSS and awkward to reason about.",
          "RGB gives the three channel values, for example rgb(31, 111, 235), and is useful when you need to know how much of each channel is present.",
          "HSL separates hue, saturation and lightness, so lightening a colour means changing one number instead of recomputing three.",
          "Opacity is a separate value from all of them. A colour plus an alpha value is what produces a translucent variant.",
        ],
      },
      {
        id: "why-a-colour-looks-different",
        heading: "Why a colour reads differently in two places",
        body: [
          "The number you copy is exact. What you see is not, for a few reasons worth knowing before you blame the picker.",
          "Displays differ in how they render colour, so the same hex value can look warmer on one screen than another. Colour profiles, screen brightness and the light in the room all shift perception. Placed next to a different background, a colour also reads lighter or darker than it is, because contrast is relative.",
        ],
        bullets: [
          "An uncalibrated screen may be showing you a different colour than the number describes.",
          "A colour on a busy background looks unlike the same colour on a plain one.",
          "A heavily compressed JPEG or WebP can shift slightly, because neighbouring pixels affect one another.",
          "Anti-aliased edges blend into the background, so sample the middle of a shape rather than its border.",
        ],
        tool: "image-color-picker",
      },
      {
        id: "palettes-from-logos",
        heading: "Getting a palette out of a logo or a screenshot",
        body: [
          "Screenshots are usually PNG and lossless, so the values you read are the true ones. A photograph of a physical object is different: the lighting, the camera's white balance and the shadow across the surface all change the colour. For a photograph, sample a bright, evenly lit area and treat the result as a match for that photograph rather than for the object.",
          "When you rebuild a palette from a logo, sample each distinct area once and write the values down. A design tool will let you build a swatch from them, which stays consistent in a way that re-sampling every time does not.",
        ],
      },
      {
        id: "using-the-value",
        heading: "Using the value",
        body: [
          "Paste the hex straight into CSS, a design tool or a document. If you need a lighter version, take the HSL value and raise the lightness channel, which keeps the hue and saturation intact and gives a shade that belongs with the original.",
          "For a project that wants an image embedded in CSS rather than linked, the same file can be turned into a data URI in the browser, so the stylesheet carries the image with no extra request.",
        ],
        tool: "image-to-base64",
      },
    ],
    faqs: [
      {
        q: "Is the pixel colour exact?",
        a: "For a lossless image such as a PNG screenshot, yes, you get the stored value. For a lossy JPEG or WebP the stored value has already been approximated by the compression, so treat it as very close rather than authoritative.",
      },
      {
        q: "Can I pick a colour from anything on screen, not just a file?",
        a: "This kind of tool works on an image you load into it. To sample something in another application, use the one your operating system provides, such as the Digital Colour Meter on macOS or PowerToys on Windows.",
      },
      {
        q: "Can I pick a colour from a PDF?",
        a: "Take a screenshot of the page first and sample that. A PNG screenshot is lossless, so the value you read is the one that was drawn.",
      },
      {
        q: "Does picking a colour upload my image?",
        a: "Not with a local picker. The image is decoded in your browser and the values are read from those pixels on your device, so nothing is sent anywhere.",
      },
      {
        q: "Why does the background change how a colour looks?",
        a: "Because colour perception is relative. A mid grey next to black looks light, and the same grey next to white looks dark. Judge a colour against the surface it will actually sit on.",
      },
    ],
  },
];
