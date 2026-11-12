import Link from "next/link";

import { HomeShortcuts } from "@/components/home/home-shortcuts";
import { MiniTasks } from "@/components/home/mini-tasks";
import { SmartBox } from "@/components/home/smart-box";
import { buildSearchIndex } from "@/lib/search-index";
import { indexCatalog } from "@/lib/tools/index-view";
import { liveTools } from "@/lib/tools/registry";

/**
 * The hero is the one authored moment on the page: a left-aligned headline in
 * Inter, one sentence that states the real promise, and the smart box, which is
 * the primary action. Everything below it is the index.
 *
 * The box comes first and the prose second, because a visitor who has something
 * to paste should not have to read past a paragraph to find out where to put it.
 * “Runs on your device” is stated here exactly once, and again on a tool page —
 * never repeated down the rows of the index, where it would carry no information.
 */
export function Hero() {
  const searchIndex = buildSearchIndex();
  const catalog = indexCatalog();

  return (
    <section className="border-b border-line">
      <div className="container-page pb-12 pt-12 sm:pb-14 sm:pt-16">
        <p className="eyebrow">Free · No account · {liveTools.length} tools</p>

        <h1 className="mt-4 max-w-[18ch] text-4xl font-bold leading-[1.03] tracking-[-0.035em] text-fg sm:text-5xl lg:text-[4rem]">
          Small tools, done properly.
        </h1>

        <p className="measure mt-4 text-base leading-relaxed text-muted sm:text-lg">
          A search box, a paste area and a drop zone in one field. Type what you need, paste the text
          you have, or drop a file — the tools all run on your device, so your file or your words never
          leave this tab.
        </p>

        <div className="mt-7 max-w-3xl">
          <SmartBox entries={searchIndex} />
          <p className="mt-3 text-sm text-muted">
            Press <kbd className="kbd">/</kbd> anywhere to search, or{" "}
            <Link href="#tools-index-heading" className="link">
              browse the full index
            </Link>
            .
          </p>

          <HomeShortcuts catalog={catalog} />
        </div>

        <MiniTasks />
      </div>
    </section>
  );
}
