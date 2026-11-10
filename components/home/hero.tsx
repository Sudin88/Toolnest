import Link from "next/link";

import { HeroSearch } from "@/components/home/hero-search";
import { buildSearchIndex } from "@/lib/search-index";
import { liveTools, popularTools } from "@/lib/tools/registry";

export function Hero() {
  const searchIndex = buildSearchIndex();
  const popular = popularTools(5);

  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      <div className="hero-atmosphere" aria-hidden="true" />
      <div className="grid-lines" aria-hidden="true" />

      <div className="container-page relative z-10 pt-14 pb-12 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20">
        <h1 className="max-w-[20ch] text-[2.125rem] font-extrabold leading-[1.06] text-fg sm:text-5xl lg:text-[3.5rem]">
          Everything you need. One simple toolbox.
        </h1>

        <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-muted sm:text-lg">
          Free online tools for your everyday work. Convert, compress, calculate, create and get
          things done — without an account, and without uploading your files.
        </p>

        <div className="mt-8 max-w-2xl">
          <HeroSearch entries={searchIndex} />
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-2 gap-y-2">
          <span className="text-sm text-muted">Popular:</span>
          {popular.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="rounded-full border border-line bg-surface/70 px-3 py-1.5 text-[0.8125rem] font-medium text-fg no-underline transition-colors duration-150 ease-out hover:border-accent/50 hover:bg-surface"
            >
              {tool.name}
            </Link>
          ))}
          <span className="num ml-1 text-[0.8125rem] text-muted">
            {liveTools.length} tools and counting
          </span>
        </div>
      </div>
    </section>
  );
}
