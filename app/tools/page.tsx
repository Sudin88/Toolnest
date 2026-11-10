import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { AdSlot } from "@/components/ads/ad-slot";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard } from "@/components/tools/tool-card";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { categories } from "@/lib/tools/categories";
import { countByCategory, liveTools, plannedTools, toolsInCategory } from "@/lib/tools/registry";

export const metadata = pageMetadata({
  title: "All tools",
  description: `Browse every free tool on ToolNest — ${liveTools.length} utilities for PDFs, images, text, numbers and small daily jobs. No account, and the work happens in your browser.`,
  path: "/tools",
});

const liveGroups = categories
  .map((category) => ({ category, tools: toolsInCategory(category.id).filter((t) => t.status === "live") }))
  .filter((group) => group.tools.length > 0);

export default function ToolsPage() {
  const planned = plannedTools;

  return (
    <>
      <div className="border-b border-line bg-surface-2">
        <div className="container-page py-8 sm:py-10">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All tools" }]} />
          <h1 className="mt-5 text-3xl font-extrabold text-fg sm:text-4xl">All tools</h1>
          <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-muted">
            {liveTools.length} tools, grouped by the job they do. Every one runs without an account,
            and the file or text you hand it is processed on your device wherever the browser makes
            that possible.
          </p>
        </div>
      </div>

      <div className="container-page pt-12">
        <nav aria-label="Jump to a category" className="flex flex-wrap gap-2">
          {liveGroups.map(({ category }) => (
            <a
              key={category.slug}
              href={`#category-${category.slug}`}
              className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-fg no-underline transition-colors duration-150 ease-out hover:border-accent/50 hover:bg-surface-2"
            >
              {category.name}
              <span className="num ml-1.5 text-xs text-muted">{countByCategory(category.id).live}</span>
            </a>
          ))}
        </nav>

        <div className="mt-14 flex flex-col gap-16">
          {liveGroups.map(({ category, tools }, index) => (
            <section key={category.slug} id={`category-${category.slug}`} aria-labelledby={`h-${category.slug}`}>
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div>
                  <h2 id={`h-${category.slug}`} className="text-2xl font-extrabold text-fg">
                    {category.name}
                  </h2>
                  <p className="mt-1.5 max-w-[56ch] text-sm text-muted">{category.tagline}</p>
                </div>
                <Link
                  href={`/categories/${category.slug}`}
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text no-underline"
                >
                  About {category.navLabel} tools
                  <ArrowRight
                    className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>

              {index === 1 ? (
                <div className="pt-16">
                  <AdSlot slot="tools-mid" minHeight={120} />
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </div>

      {planned.length > 0 ? (
        <section aria-labelledby="planned-tools" className="container-page pt-16">
          <h2 id="planned-tools" className="text-xl font-extrabold text-fg">
            In the works
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted">
            These are on the roadmap but are not finished, so they are not linked yet. They will
            appear above once they work — we would rather list them here than ship a page that does
            nothing.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {planned.map((tool) => (
              <li
                key={tool.slug}
                className="rounded-full border border-dashed border-line-strong px-3.5 py-1.5 text-sm text-muted"
              >
                {tool.name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <JsonLd
        data={breadcrumbJsonLd([{ name: "All tools", path: "/tools" }])}
      />
      <JsonLd
        data={itemListJsonLd(
          "All ToolNest tools",
          liveTools.map((tool) => ({ name: tool.name, path: `/tools/${tool.slug}` })),
        )}
      />
    </>
  );
}
