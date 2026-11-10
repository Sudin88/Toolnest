import { ArrowRight, Cpu, ShieldCheck, Sparkles, UserX } from "lucide-react";
import Link from "next/link";

import { AdSlot } from "@/components/ads/ad-slot";
import { Hero } from "@/components/home/hero";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard, ToolRow } from "@/components/tools/tool-card";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { faqJsonLd, websiteJsonLd } from "@/lib/seo";
import { categories } from "@/lib/tools/categories";
import { countByCategory, liveTools, popularTools, recentlyAdded } from "@/lib/tools/registry";
import type { Faq } from "@/lib/tools/types";

/**
 * The homepage persuades: it states what the product is, shows the tools that
 * prove it, and is honest about how the thing is paid for. Every list on this
 * page is derived from the registry, so nothing here can advertise a tool that
 * has not been built.
 */

const homeFaqs: Faq[] = [
  {
    q: "Is ToolNest really free?",
    a: "Yes. Every tool is free to use, with no account, no trial period and no paid tier. The site is supported by clearly labelled advertising, which is why you may see an ad slot between sections.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. There is nothing to sign up for and nothing to sign in to. Open a tool, use it, close the tab.",
  },
  {
    q: "Are my files uploaded to a server?",
    a: "Most of these tools process your file inside the browser tab, using the capabilities your device already has. Those tools are marked as running on your device. For anything that genuinely needs a server, the tool page says so before you start — we do not call something private when it is not.",
  },
  {
    q: "How does ToolNest make money if the tools are free?",
    a: "Advertising. Ad slots are reserved, labelled as advertisements and kept away from the controls you are using, so they cannot be mistaken for a button or a download.",
  },
  {
    q: "Do the tools work on a phone?",
    a: "Yes. The layout is built for a narrow screen first, and the file and photo tools use the device's own picker. On mobile, very large documents are limited by the memory of the phone rather than by the tool.",
  },
];

export default function HomePage() {
  const popular = popularTools(8);
  const recent = recentlyAdded(5);
  const totalLive = liveTools.length;

  return (
    <>
      <Hero />

      <section aria-labelledby="popular-tools" className="container-page pt-14 sm:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h2 id="popular-tools" className="text-2xl font-extrabold text-fg sm:text-3xl">
              Popular tools
            </h2>
            <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted sm:text-base">
              The tools people open most often. No account, no queue, and the work happens as soon
              as you give the tool something to work with.
            </p>
          </div>
          <Link
            href="/tools"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text no-underline"
          >
            Browse all {totalLive} tools
            <ArrowRight
              className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} showCategory />
          ))}
        </div>
      </section>

      <section aria-labelledby="browse-categories" className="container-page pt-16 sm:pt-20">
        <h2 id="browse-categories" className="text-2xl font-extrabold text-fg sm:text-3xl">
          Browse by category
        </h2>
        <p className="mt-2 max-w-[54ch] text-sm leading-relaxed text-muted sm:text-base">
          Six groups, one job each. Start with the kind of file you are holding.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const counts = countByCategory(category.id);
            return (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="panel card-interactive group flex items-start gap-4 p-5 no-underline"
              >
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-accent transition-colors duration-150 ease-out group-hover:border-accent/40">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-[1.0625rem] font-bold text-fg">
                      {category.name}
                    </span>
                    <span className="num shrink-0 text-xs text-muted">
                      {counts.live > 0 ? `${counts.live} tools` : "coming soon"}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">
                    {category.tagline}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="pt-16 sm:pt-20">
        <AdSlot slot="home-mid" minHeight={120} />
      </div>

      <section aria-labelledby="recently-added" className="container-page pt-16 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div className="min-w-0">
            <h2 id="recently-added" className="text-2xl font-extrabold text-fg sm:text-3xl">
              Recently added
            </h2>
            <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-muted sm:text-base">
              New tools land here first.
            </p>
            <div className="mt-6 panel-inset p-2">
              <ul>
                {recent.map((tool) => (
                  <li key={tool.slug}>
                    <ToolRow tool={tool} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold text-fg sm:text-3xl">Why ToolNest</h2>
            <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-muted sm:text-base">
              A small set of promises that shape every tool on the site.
            </p>
            <ul className="mt-6 flex flex-col gap-5">
              <Promise
                icon={UserX}
                title="Nothing to sign up for"
                body="There is no account, no dashboard and no email to hand over. A tool is one page you can leave whenever you like."
              />
              <Promise
                icon={Cpu}
                title="Your file stays on your device"
                body="Where a job can be done in the browser, it is — the document or image is handled locally and never uploaded. Tools that need a server say so up front."
              />
              <Promise
                icon={Sparkles}
                title="No artificial paywall"
                body="Work is limited by your own device, not by a size counter designed to sell you an upgrade. Every tool is the whole tool."
              />
              <Promise
                icon={ShieldCheck}
                title="Honest about limits"
                body="If a tool cannot do something, the page says so before you start rather than letting you find out by failing."
              />
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="home-faq" className="container-page pt-16 sm:pt-20">
        <div className="max-w-3xl">
          <h2 id="home-faq" className="text-2xl font-extrabold text-fg sm:text-3xl">
            Questions, answered plainly
          </h2>
          <FaqAccordion faqs={homeFaqs} className="mt-8" />
        </div>
      </section>

      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={faqJsonLd(homeFaqs)} />
    </>
  );
}

function Promise({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Cpu;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 text-accent">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[0.9375rem] font-semibold text-fg">{title}</span>
        <span className="mt-1 block max-w-[52ch] text-sm leading-relaxed text-muted">{body}</span>
      </span>
    </li>
  );
}
