import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolRow } from "@/components/tools/tool-row";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { guideReadingMinutes, getGuide, guides } from "@/lib/guides/registry";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, howToJsonLd, pageMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools/registry";

/**
 * A guide page. The writing is the product here rather than a workspace, so the
 * layout is one measured column with a rail that holds the table of contents and
 * the tools the guide points at. Every guide is derived from the guides registry,
 * which validates at load time that each tool it names is actually live.
 */
export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  return pageMetadata({
    title: guide.metaTitle,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    type: "article",
  });
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Formatted from the ISO parts, so the label cannot shift with the build's timezone. */
function reviewedLabel(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const tools = guide.tools.flatMap((toolSlug) => {
    const tool = getTool(toolSlug);
    return tool && tool.status === "live" ? [tool] : [];
  });

  const stepSections = guide.sections.filter((section) => (section.steps ?? []).length > 0);
  const faqs = guide.faqs ?? [];

  return (
    <>
      <div className="border-b border-line">
        <div className="container-page pb-10 pt-10 sm:pb-12 sm:pt-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Guides", href: "/guides" },
              { label: guide.title },
            ]}
          />
          <h1 className="measure mt-6 text-3xl leading-tight tracking-[-0.02em] text-fg sm:text-[2.5rem]">
            {guide.title}
          </h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="num">Reviewed {reviewedLabel(guide.updated)}</span>
            <span aria-hidden="true">·</span>
            <span className="num">{guideReadingMinutes(guide)} min read</span>
          </p>
          <div className="measure mt-6 flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
            {guide.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="container-page pb-20 pt-12">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-12">
          <div className="min-w-0">
            <div className="prose-tool measure">
              {guide.sections.map((section) => {
                const tool = section.tool ? getTool(section.tool) : undefined;

                return (
                  <section key={section.id}>
                    <h2 id={section.id} className="scroll-mt-24">
                      {section.heading}
                    </h2>

                    {section.body?.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}

                    {section.steps?.length ? (
                      <ol>
                        {section.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    ) : null}

                    {section.bullets?.length ? (
                      <ul>
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}

                    {tool ? (
                      <p>
                        <Link href={`/tools/${tool.slug}`} className="link">
                          Open the {tool.name}
                        </Link>{" "}
                        and try it on your own file.
                      </p>
                    ) : null}
                  </section>
                );
              })}

              {faqs.length > 0 ? (
                <section>
                  <h2 id="questions" className="scroll-mt-24">
                    Questions
                  </h2>
                </section>
              ) : null}
            </div>

            {faqs.length > 0 ? <FaqAccordion faqs={faqs} className="measure mt-6" /> : null}

            {/* On a phone there is no rail, so the tools the guide points at run
                here and the links into the product are not lost. */}
            <section
              aria-labelledby="guide-tools"
              className="mt-14 border-t border-line pt-10 lg:hidden"
            >
              <h2 id="guide-tools" className="text-2xl text-fg">
                Tools in this guide
              </h2>
              <ul className="mt-4 grid gap-x-8 border-t border-line sm:grid-cols-[repeat(2,minmax(0,1fr))]">
                {tools.map((tool) => (
                  <li key={tool.slug} className="min-w-0 border-b border-line">
                    <ToolRow tool={tool} showCategory={false} />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
            <div className="panel p-4">
              <p className="eyebrow text-fg">On this page</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {guide.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="text-muted no-underline hover:text-fg">
                      {section.heading}
                    </a>
                  </li>
                ))}
                {faqs.length > 0 ? (
                  <li>
                    <a href="#questions" className="text-muted no-underline hover:text-fg">
                      Questions
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>

            <div className="panel mt-4 p-4">
              <p className="eyebrow text-fg">Tools in this guide</p>
              <ul className="mt-2 flex flex-col">
                {tools.map((tool) => (
                  <li key={tool.slug} className="min-w-0 border-b border-line last:border-b-0">
                    <ToolRow tool={tool} showCategory={false} />
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm">
                <Link href="/guides" className="link">
                  All guides
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Guides", path: "/guides" },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          title: guide.title,
          description: guide.description,
          path: `/guides/${guide.slug}`,
          updated: guide.updated,
        })}
      />
      {stepSections.map((section) => (
        <JsonLd
          key={section.id}
          data={howToJsonLd(section.heading, section.steps ?? [])}
        />
      ))}
      {faqs.length > 0 ? <JsonLd data={faqJsonLd(faqs)} /> : null}
    </>
  );
}
