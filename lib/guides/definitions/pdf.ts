import type { Guide } from "@/lib/guides/types";

export const pdfGuides: Guide[] = [
  {
    slug: "merge-pdf-without-uploading",
    title: "How to merge PDFs without uploading them anywhere",
    metaTitle: "How to Merge PDFs Without Uploading Them",
    description:
      "Combine several PDFs into one document entirely in the browser, in the order you choose, with nothing sent to a server. Here is how it works.",
    updated: "2026-11-12",
    topic: "PDF",
    tools: ["merge-pdf", "split-pdf", "images-to-pdf"],
    intro: [
      "Most PDF mergers ask you to upload your files first. That is fine for a takeaway menu and less fine for a passport scan, a signed contract or a letter from a hospital. Once a document leaves your machine it is on someone else's disk, under someone else's retention policy, for however long they choose to keep it.",
      "There is a way to combine PDFs that never uploads anything. A tool that runs in the browser reads the file from your disk into the tab's memory, copies the pages into a new document there, and hands the result back to your downloads folder. Nothing in that sequence needs a server.",
    ],
    sections: [
      {
        id: "what-the-browser-does",
        heading: "What the browser actually does",
        body: [
          "When you choose a file, the browser keeps a reference to it on your disk. It does not copy the bytes anywhere until something asks for them, and only the page you are on can ask.",
          "A local merger asks for them, parses the PDF structure, builds a new document in memory page by page, and offers that as a download. You can watch the whole thing happen in your browser's Network tab: the only requests you will see are for the page and its assets, and none of them carries your document.",
        ],
        tool: "merge-pdf",
      },
      {
        id: "merging-step-by-step",
        heading: "Merging in four steps",
        steps: [
          "Open the merge tool and add two or more PDFs, by dropping them onto the panel or using the file picker. You can add them in any order.",
          "Set the order you want. The list is the document: the first file's pages come first, and each file shows its own page count.",
          "Read the page total before you merge. It is the quickest way to catch a file you added twice or one that failed to load.",
          "Merge and download. The combined file is built in the tab and saved straight to your device under the name you choose.",
        ],
        tool: "merge-pdf",
      },
      {
        id: "order-and-page-numbers",
        heading: "Order, page numbers and bookmarks",
        body: [
          "Merging copies pages in the sequence you set. It does not renumber anything for you, so if the source documents had printed page numbers of their own, the combined file will show two page 1s. That is expected, and it is why a merged set often gets a coversheet or a new footer before it goes out.",
          "Bookmarks, internal links and form fields are the fragile part of any merge. A well-behaved tool carries page content across exactly and is honest that an interactive form may stop behaving once a second document is appended. If a form has to keep working, merge it last or send it as its own file.",
        ],
        bullets: [
          "Page content, text and images copy across faithfully.",
          "Printed page numbers stay as printed, so expect repeats.",
          "Interactive form fields can stop responding after a merge.",
          "An encrypted PDF has to be unlocked before any tool can read its pages.",
        ],
      },
      {
        id: "checking-it-stayed-local",
        heading: "Checking that nothing left your machine",
        body: [
          "You do not have to take a privacy claim on trust. Press F12 or Ctrl+Shift+I to open developer tools, choose the Network tab and clear it, then merge a file. A local tool adds no request while it works. A tool that uploads your document has to send the bytes, and you would see a POST with a body roughly the size of the file.",
          "The stronger test is to load the page first, then turn off your Wi-Fi and merge with the connection down. A tool that needs a server fails immediately; a tool that runs in the tab does not notice.",
        ],
        tool: "merge-pdf",
      },
      {
        id: "when-a-browser-merge-is-wrong",
        heading: "When a browser merge is the wrong tool",
        body: [
          "If you are assembling a document from a hundred files on a network share, or the result has to be stored somewhere central, a desktop or server tool fits better. The browser approach is best for the one-off job on files you would rather not hand over, which is most of them.",
          "If the job is the opposite one, cutting a document apart rather than gluing documents together, the same local approach applies to splitting.",
        ],
        tool: "split-pdf",
      },
    ],
    faqs: [
      {
        q: "Is there a file size limit?",
        a: "Only the memory the browser will give a tab, which is generous. Very large scans of several hundred megabytes are slow but usually still work. If a merge stalls, close some other tabs and try again with fewer files at a time.",
      },
      {
        q: "Does merging reduce quality?",
        a: "No. Pages are copied as they are rather than re-rendered, so text stays selectable and images are not recompressed.",
      },
      {
        q: "Can I merge password-protected PDFs?",
        a: "Not while they are locked. Open each one with its password in a PDF reader, save an unlocked copy, then merge that copy.",
      },
      {
        q: "What happens to the files afterwards?",
        a: "Nothing is stored anywhere. The tab holds them in memory while it works and releases them when you close the page, so there is no copy left to delete.",
      },
    ],
  },
  {
    slug: "split-pdf-in-the-browser",
    title: "How to split a PDF into separate files in your browser",
    metaTitle: "How to Split a PDF in Your Browser",
    description:
      "Pull a page range out of a PDF, or break a long document into single pages, entirely in the browser. No upload, no queue, nothing kept afterwards.",
    updated: "2026-11-12",
    topic: "PDF",
    tools: ["split-pdf", "extract-pdf-pages", "merge-pdf"],
    intro: [
      "PDFs arrive as one file even when they are really several: a scanned invoice with its receipt attached, a report with an appendix, a submission with signed forms at the back. Pulling them apart is a two-minute job, and it does not have to involve sending the document to a server.",
      "A browser tool can read the page tree, copy the pages you ask for into a new document and hand you the result, all on your own device. Below is how to split a PDF, and how to tell which of the two approaches you actually want.",
    ],
    sections: [
      {
        id: "two-jobs-called-splitting",
        heading: "Two different jobs that both get called splitting",
        body: [
          "Breaking a document into one file per page is not the same job as pulling out a range. The first leaves you with many small files, the second with one shorter file. Tools blur the two, so it is worth deciding which one you need before you start.",
        ],
        bullets: [
          "Extract a range, when you want pages 4 to 9 as a single file.",
          "Split into single pages, when you want one file per page, for example to upload each page separately.",
          "Remove pages, when you want the original minus a few, which is a split where you keep everything else.",
        ],
        tool: "split-pdf",
      },
      {
        id: "splitting-step-by-step",
        heading: "Splitting a document step by step",
        steps: [
          "Open the split tool and add your PDF. The page count appears straight away, which is a useful check before you cut anything.",
          "Choose the mode. Range mode takes a span such as 4 to 9; single-page mode turns every page into its own file.",
          "Confirm the boundary against the preview or the page list. An off-by-one here is easy to make and slow to notice later.",
          "Split, then download. When the operation produces many parts they are offered together, so you are not clicking through a dozen downloads.",
        ],
        tool: "split-pdf",
      },
      {
        id: "page-ranges",
        heading: "Page ranges and the off-by-one mistake",
        body: [
          "Ranges are inclusive at both ends and start at 1, which matches the printed page number in almost every document. The common mistake is to think of a ten-page document as pages 0 to 9 out of habit from programming. If your extraction is short by exactly one page, that is usually why.",
          "When the printed numbers differ from the position in the file, which happens whenever a cover or contents page is unnumbered, count from the first page of the file and ignore the printed footer until the boundary is right. Most tools show the file position next to a preview for exactly this reason.",
        ],
      },
      {
        id: "what-survives-the-cut",
        heading: "What survives the cut",
        body: [
          "Pages keep their own size, orientation and content, including mixed sizes inside one document. Text stays selectable and images are copied rather than re-encoded, so a split does not cost you quality.",
          "What does not always survive is anything that referred to the whole document: a bookmark pointing at a later chapter, an internal link, or a form field that is now on a page the reader cannot reach. If a split file is going to a client, give it one scroll before you send it.",
        ],
      },
      {
        id: "confirming-no-upload",
        heading: "Confirming the file stayed on your device",
        body: [
          "Open developer tools, switch to the Network tab and split a file. A local tool adds no request as it works. You can also load the page, disconnect from the internet and split anyway, which a server-based tool cannot do.",
          "When you have the parts you need, joining some of them back together is the same local operation in reverse.",
        ],
        tool: "merge-pdf",
      },
    ],
    faqs: [
      {
        q: "Can I split a scanned PDF?",
        a: "Yes. A scan is still a PDF with a standard page tree, so it splits like any other. The pages themselves stay images, so any text in them stays unselectable unless you run OCR separately.",
      },
      {
        q: "Does splitting copy the pages or move them?",
        a: "It copies. Your original file is untouched and the new document is built separately, so you can split the same file several different ways and keep all the results.",
      },
      {
        q: "How do I split every page into its own file?",
        a: "Use the single-page mode rather than a range. That produces one file per page and names them in order.",
      },
      {
        q: "Will the split files keep the original quality?",
        a: "Yes. Pages are copied rather than re-rendered, so nothing is recompressed and the results are as sharp as the source.",
      },
    ],
  },
  {
    slug: "does-a-pdf-tool-upload-your-file",
    title: "How to tell whether a PDF tool uploads your file",
    metaTitle: "How to Tell If a PDF Tool Uploads Your File",
    description:
      "A five-minute test that shows whether an online tool sends your document to a server or handles it in the browser, using only your own developer tools.",
    updated: "2026-11-12",
    topic: "PDF",
    tools: ["merge-pdf", "split-pdf", "rotate-pdf", "compress-image"],
    intro: [
      "Almost every online tool says your files are safe. Very few explain how they know. Whether a tool processes your document in the browser or uploads it is checkable in about five minutes, and you do not need to be a developer to see the answer.",
      "Here is the test, in order of strength. The last one is the one that cannot be faked.",
    ],
    sections: [
      {
        id: "watch-the-network-tab",
        heading: "Watch the Network tab while you work",
        body: [
          "Open the tool, press F12 or Ctrl+Shift+I, and choose the Network tab. Clear whatever is already listed. Now do the work: add your file, run the operation, download the result.",
          "A tool that keeps the file on your device adds no request while it processes. A tool that uploads it has to send the bytes, and the bytes have to appear somewhere, so look for a POST or PUT whose body is roughly the size of your file.",
        ],
        bullets: [
          "A request appearing the moment you add a file, before you click anything, is an upload. Some tools send immediately.",
          "A request whose body is hundreds of kilobytes when your file is hundreds of kilobytes is an upload.",
          "No request at all between adding the file and getting the result means the work happened in the tab.",
        ],
        tool: "merge-pdf",
      },
      {
        id: "load-then-disconnect",
        heading: "Load the page, then disconnect",
        body: [
          "This is the test that settles it. Load the tool while you still have a connection, then turn off Wi-Fi or unplug the cable and use it. A tool that needs a server fails at the first step, usually with a spinner that never resolves or a generic error. A tool that runs in the browser will not notice the difference.",
          "There is one limit worth knowing. A page that never finished loading cannot pass this test, so load it fully and only then go offline. Working offline also proves only where the processing happened, not what the page does with your data before you act, so pair it with the Network tab reading above.",
        ],
      },
      {
        id: "tells-before-you-upload",
        heading: "Things you can tell before you hand over a file",
        body: [
          "You can often answer the question from the page itself, without giving it a document to work on.",
        ],
        bullets: [
          "Which library it uses. A tool built on pdf-lib or a canvas pipeline is doing the work in the browser, because that is what those libraries are for.",
          "What the file picker does. A picker that begins work the instant you choose a file, with no button to press, often means an immediate upload.",
          "The words on the page. A local tool says add or drop and never mentions an upload, because there is not one.",
          "A stated retention policy. If a site promises to delete files after an hour, that is a site accepting files in the first place.",
        ],
      },
      {
        id: "why-it-matters",
        heading: "Why the distinction is worth checking",
        body: [
          "Uploading is not automatically wrong. A server with a large memory allowance can do things a single tab cannot, such as heavy optical character recognition or processing a file too big for browser memory. The problem is not the server. It is a site that uploads without saying so, because at that point you can no longer make an informed decision about what you are sending.",
          "For a contract, a passport scan, a payslip or a hospital letter, the browser-only route removes a copy you did not need to make. For a hundred-megabyte scan you want transcribed, a server may be the only realistic option. Work out which one you are dealing with, then decide.",
        ],
        tool: "compress-image",
      },
      {
        id: "a-reusable-checklist",
        heading: "A checklist you can reuse",
        bullets: [
          "Read what the tool claims, and notice whether it explains a mechanism or simply asserts that it is safe.",
          "Open the Network tab and clear it before adding a file.",
          "Watch for a request the moment the file is added, and compare its size with the file.",
          "Load the page, disconnect from the network, and try the operation anyway.",
          "If the file still has to go somewhere, prefer the tool with no upload over the one with a retention policy.",
        ],
        tool: "split-pdf",
      },
    ],
    faqs: [
      {
        q: "Does a padlock in the address bar mean the file is not uploaded?",
        a: "No. HTTPS protects the trip to the server. It says nothing about whether there is a trip, or about what happens to the file once it arrives.",
      },
      {
        q: "If a site deletes files after an hour, is that safe?",
        a: "It means the site does accept uploads. Deleting after an hour is better than keeping them indefinitely, but the copy still existed on hardware you do not control, and you are relying on the claim being true.",
      },
      {
        q: "Can a browser tool still send my data somewhere?",
        a: "It could in principle, so test rather than assume. The Network tab shows every request the page makes, and a tool that stays local will not produce one while it works.",
      },
      {
        q: "Is offline use proof that nothing is uploaded?",
        a: "It proves the processing happened on your device, since there was no connection available to do it anywhere else. If you also want to know what the page does with analytics or error reports, read those requests separately in the Network tab.",
      },
    ],
  },
];
