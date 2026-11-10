import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { pageMetadata } from "@/lib/seo";
import { categories } from "@/lib/tools/categories";
import { countByCategory, liveTools, plannedTools, tools } from "@/lib/tools/registry";

export const metadata: Metadata = pageMetadata({
  title: "About ToolNest",
  description:
    "ToolNest is a free collection of browser-based utilities. No account, no upload, no queue — the work happens on your device.",
  path: "/about",
});

export default function AboutPage() {
  const live = liveTools.length;
  const total = tools.length;
  const planned = plannedTools.length;

  return (
    <>
      <PageHeader
        title="About ToolNest"
        intro="ToolNest is one place to get a small job done. Convert a file, count some words, work out a repayment, generate a QR code — and then close the tab. It exists because most single-purpose tool sites make you wait, sign up, or wonder what happens to the file you just handed them."
      />

      <div className="container-page pb-20 pt-12">
        <div className="prose-tool measure">
          <h2>What it is</h2>
          <p>
            A directory of free utilities organised into six categories — PDF, image, text,
            calculators, developer and everyday tools. There are {total} tools in the directory and{" "}
            {live} of them work today.{" "}
            {planned > 0
              ? "The rest are listed honestly as being in the works, and none of them is linked as if it were finished."
              : "Every one of them is finished and working."}
          </p>

          <h2>How the tools work</h2>
          <p>
            Almost everything runs in your browser. When a tool says your file never leaves your
            device, that is literal: the image is decoded by the Canvas API, the PDF is assembled by
            pdf-lib, the arithmetic happens in the page. There is no upload step because there is no
            server-side step to upload to.
          </p>
          <p>
            Where that promise cannot be kept, the tool says so on its own page rather than relying on
            you to assume the best. Being specific about what is local is the whole point — a vague
            claim of privacy is worth nothing.
          </p>

          <h2>Why there is no account</h2>
          <p>
            Nothing here needs to remember you. There is no history to sync, no documents to store and
            no settings worth a profile, so the sign-up form you would have filled in is missing on
            purpose. The only state the site keeps lives in your own browser: a short list of the tools
            you opened recently, a handful of favourites, and the draft of anything you were halfway
            through.
          </p>

          <h2>How it is paid for</h2>
          <p>
            ToolNest is free, and it stays free because of advertising. Ads are deliberately kept out
            of the working area: never inside a tool, never beside a download button, never between a
            file picker and its result. You will see a clearly labelled slot below the tool, in the
            place a magazine would put a page’s advertisement.
          </p>

          {planned > 0 ? (
            <>
              <h2>What is coming</h2>
              <p>
                These are the tools still being built. Each category page lists exactly what is in the
                works.
              </p>
              <ul>
                {categories.map((category) => {
                  const counts = countByCategory(category.id);
                  return (
                    <li key={category.slug}>
                      <Link href={`/categories/${category.slug}`} className="link">
                        {category.name}
                      </Link>{" "}
                      — {counts.live} of {counts.total} ready
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
