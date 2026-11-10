import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/ads/ad-slot";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolHost } from "@/components/tools/tool-host";
import { ToolCard } from "@/components/tools/tool-card";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata, toolJsonLd } from "@/lib/seo";
import { getCategory } from "@/lib/tools/categories";
import { getTool, liveTools, relatedTools } from "@/lib/tools/registry";

/**
 * The tool page is the product. Only `live` tools are prerendered and routable;
 * anything still `planned` resolves to a 404 rather than advertising a tool that
 * cannot do the job.
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
    title: `${tool.name} — Free Online Tool`,
    description: tool.description,
    path: `/tools/${tool.slug}`,
  });
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.status !== "live") notFound();

  const category = getCategory(tool.category);
  const Icon = tool.icon;
  const faqs = tool.faqs ?? [];
  const related = relatedTools(tool.slug, 4);

  return (
    <>
      <div className="border-b border-line bg-surface-2">
        <div className="container-page py-8 sm:py-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: category.name, href: `/categories/${category.slug}` },
              { label: tool.name },
            ]}
          />
          <div className="mt-5 flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-accent">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold text-fg sm:text-4xl">{tool.name}</h1>
              <p className="mt-1.5 text-base text-muted">{tool.tagline}</p>
            </div>
          </div>
          <p className="mt-5 max-w-[68ch] text-[0.9375rem] leading-relaxed text-muted">
            {tool.description}
          </p>
          {tool.local ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
              <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
              Runs in your browser — your input is never uploaded
            </p>
          ) : null}
        </div>
      </div>

      <div className="container-page pb-20 pt-10">
        <section aria-labelledby="tool-workspace">
          <h2 id="tool-workspace" className="sr-only">
            Use the {tool.name}
          </h2>
          <ToolHost slug={tool.slug} />
        </section>

        {tool.howTo && tool.howTo.length > 0 ? (
          <div className="prose-tool measure pt-14">
            <h2>How to use the {tool.name.toLowerCase()}</h2>
            <ol>
              {tool.howTo.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}

        {tool.limits && tool.limits.length > 0 ? (
          <div className="prose-tool measure pt-10">
            <h2>What this tool cannot do</h2>
            <ul>
              {tool.limits.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {faqs.length > 0 ? (
          <section aria-labelledby="tool-faq" className="pt-14">
            <h2 id="tool-faq" className="text-xl font-extrabold text-fg">
              Frequently asked questions
            </h2>
            <FaqAccordion faqs={faqs} className="mt-5" />
          </section>
        ) : null}

        <div className="pt-14">
          <AdSlot slot={`tool-${tool.slug}`} minHeight={120} />
        </div>

        <section aria-labelledby="tool-related" className="pt-14">
          <h2 id="tool-related" className="text-xl font-extrabold text-fg">
            Related tools
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ToolCard key={item.slug} tool={item} showCategory />
            ))}
          </div>
        </section>
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
