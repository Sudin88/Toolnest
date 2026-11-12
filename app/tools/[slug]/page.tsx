import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/ads/ad-slot";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { FavouriteStar } from "@/components/tools/favourite-star";
import { Shortcuts } from "@/components/tools/interactive";
import { ToolHost } from "@/components/tools/tool-host";
import { ToolRow } from "@/components/tools/tool-row";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, toolJsonLd } from "@/lib/seo";
import { adsEnabled } from "@/lib/site";
import { getCategory } from "@/lib/tools/categories";
import { getTool, liveTools, relatedTools } from "@/lib/tools/registry";

/**
 * The tool page is the product. The workspace sits first and above the fold; a
 * sticky rail on wide screens carries the short how-to, the siblings and the
 * star, while everything editorial — the full instructions, the limits, the
 * questions — runs down the main column. Only `live` tools are prerendered and
 * routable; anything still `planned` resolves to a 404 rather than advertising a
 * tool that cannot do the job.
 */
export function generateStaticParams() {
  return liveTools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.status !== "live") return {};

  return pageMetadata({
    title: `${tool.name}: Free Online Tool`,
    description: tool.description,
    path: `/tools/${tool.slug}`,
  });
}

/** The keys that work while a tool is open. Search closes over the whole app. */
const pageShortcuts = [
  { keys: "Ctrl/⌘ K", action: "Search every tool" },
  { keys: "/", action: "Jump to search" },
  { keys: "Esc", action: "Close a panel" },
];

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.status !== "live") notFound();

  const category = getCategory(tool.category);
  const faqs = tool.faqs ?? [];
  const related = relatedTools(tool.slug, 4);
  const howTo = tool.howTo ?? [];
  const limits = tool.limits ?? [];

  return (
    <>
      {/* Compact working header: where you are, what this is, and the promises
          that matter — the star and the device note, stated once. */}
      <div className="border-b border-line">
        <div className="container-page py-6 sm:py-7">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: category.name, href: `/categories/${category.slug}` },
              { label: tool.name },
            ]}
          />
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <h1 className="text-[1.75rem] leading-tight tracking-[-0.02em] text-fg sm:text-4xl">
              {tool.name}
            </h1>
            <div className="flex items-center gap-2">
              <FavouriteStar slug={tool.slug} name={tool.name} />
              <Shortcuts items={pageShortcuts} label={`Shortcuts for the ${tool.name}`} />
            </div>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted sm:text-base">
            <span>{tool.tagline}</span>
            <span className="chip">
              <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
              {tool.local ? "Runs on your device" : "Processed on a server"}
            </span>
          </p>
        </div>
      </div>

      <div className="container-page pb-20 pt-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-12">
          <div className="min-w-0">
            <section aria-labelledby="tool-workspace">
              <h2 id="tool-workspace" className="sr-only">
                Use the {tool.name}
              </h2>
              <ToolHost slug={tool.slug} />
            </section>

            <div className="mt-14 flex flex-col gap-10">
              <p className="measure text-[0.9375rem] leading-relaxed text-muted">{tool.description}</p>

              {howTo.length > 0 ? (
                <section aria-labelledby="how-to" className="prose-tool measure">
                  <h2 id="how-to">How to use the {tool.name}</h2>
                  <ol>
                    {howTo.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </section>
              ) : null}

              {limits.length > 0 ? (
                <section aria-labelledby="limits" className="prose-tool measure">
                  <h2 id="limits">What this tool cannot do</h2>
                  <ul>
                    {limits.map((limit) => (
                      <li key={limit}>{limit}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {faqs.length > 0 ? (
                <section aria-labelledby="faq">
                  <h2 id="faq" className="text-2xl text-fg">
                    Frequently asked questions
                  </h2>
                  <FaqAccordion faqs={faqs} className="mt-5" />
                </section>
              ) : null}

              {/* The ad band only takes up rhythm when there is an ad to put in
                  it, and it is set well below the controls, never beside them. */}
              {adsEnabled ? (
                <div className="pt-4">
                  <AdSlot slot={`tool-${tool.slug}`} minHeight={120} />
                </div>
              ) : null}
            </div>

            {/* Siblings live in the rail on wide screens; on a phone there is no
                rail, so the same list runs here and the internal links are not
                lost on small screens. */}
            <section aria-labelledby="tool-related" className="mt-14 border-t border-line pt-10 lg:hidden">
              <h2 id="tool-related" className="text-2xl text-fg">
                Related tools
              </h2>
              <ul className="mt-4 grid gap-x-8 border-t border-line sm:grid-cols-[repeat(2,minmax(0,1fr))]">
                {related.map((item) => (
                  <li key={item.slug} className="min-w-0 border-b border-line">
                    <ToolRow tool={item} showCategory={false} />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Wide-screen rail. It stays put while the workspace scrolls, so the
              how-to and the star are always a glance away. */}
          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <div className="panel p-4">
              <p className="eyebrow text-fg">On this page</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                <li>
                  <a href="#tool-workspace" className="text-muted no-underline hover:text-fg">
                    The tool
                  </a>
                </li>
                {howTo.length > 0 ? (
                  <li>
                    <a href="#how-to" className="text-muted no-underline hover:text-fg">
                      How to use it
                    </a>
                  </li>
                ) : null}
                {limits.length > 0 ? (
                  <li>
                    <a href="#limits" className="text-muted no-underline hover:text-fg">
                      What it cannot do
                    </a>
                  </li>
                ) : null}
                {faqs.length > 0 ? (
                  <li>
                    <a href="#faq" className="text-muted no-underline hover:text-fg">
                      Questions
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>

            {howTo.length > 0 ? (
              <div className="panel mt-4 p-4">
                <p className="eyebrow text-fg">How to use it</p>
                <ol className="mt-3 flex flex-col gap-2.5 text-sm leading-relaxed text-muted">
                  {howTo.slice(0, 3).map((step) => (
                    <li key={step} className="flex gap-2.5">
                      <span className="num mt-0.5 shrink-0 text-accent-text" aria-hidden="true">
                        →
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="panel mt-4 p-4">
              <p className="eyebrow text-fg">Related tools</p>
              <ul className="mt-2 flex flex-col">
                {related.slice(0, 3).map((item) => (
                  <li key={item.slug} className="min-w-0 border-b border-line last:border-b-0">
                    <ToolRow tool={item} showCategory={false} />
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm">
                <Link href={`/categories/${category.slug}`} className="link">
                  All {category.name.toLowerCase()}
                </Link>
              </p>
            </div>

            <div className="panel mt-4 p-4">
              <p className="flex items-center gap-2 eyebrow text-fg">
                <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
                {tool.local ? "On your device" : "Server processing"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {tool.local
                  ? "Your input is processed in this browser tab and never uploaded. Nothing is stored once you close the page."
                  : "This tool sends your input to a server to do its work. The page says so before you start."}
              </p>
            </div>
          </aside>
        </div>
      </div>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: category.name, path: `/categories/${category.slug}` },
          { name: tool.name, path: `/tools/${tool.slug}` },
        ])}
      />
      <JsonLd data={toolJsonLd(tool)} />
      {faqs.length > 0 ? <JsonLd data={faqJsonLd(faqs)} /> : null}
    </>
  );
}
