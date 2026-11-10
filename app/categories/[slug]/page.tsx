import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/ads/ad-slot";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolCard } from "@/components/tools/tool-card";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { categories, categoryBySlug } from "@/lib/tools/categories";
import { countByCategory, toolsInCategory } from "@/lib/tools/registry";

/**
 * Category pages are the hub layer between the homepage and the tools. They are
 * prerendered at build time from the same category list the nav uses, so a
 * category can never link somewhere the nav cannot.
 */
export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categoryBySlug.get(slug);
  if (!category) return {};

  // A category with nothing live yet is a holding page, not something we want
  // search engines to index or rank.
  const isEmpty = !toolsInCategory(category.id).some((tool) => tool.status === "live");

  return pageMetadata({
    title: category.name,
    description: category.description,
    path: `/categories/${category.slug}`,
    noIndex: isEmpty,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categoryBySlug.get(slug);
  if (!category) notFound();

  const Icon = category.icon;
  const all = toolsInCategory(category.id);
  const live = all.filter((tool) => tool.status === "live");
  const planned = all.filter((tool) => tool.status === "planned");
  const others = categories.filter((item) => item.id !== category.id);

  return (
    <>
      <div className="border-b border-line bg-surface-2">
        <div className="container-page py-8 sm:py-10">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: category.name }]}
          />
          <div className="mt-5 flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-accent">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold text-fg sm:text-4xl">{category.name}</h1>
              <p className="mt-1.5 text-base text-muted">{category.tagline}</p>
            </div>
          </div>
          <p className="mt-5 max-w-[68ch] text-[0.9375rem] leading-relaxed text-muted">
            {category.intro}
          </p>
        </div>
      </div>

      <div className="container-page pt-12">
        {live.length > 0 ? (
          <section aria-labelledby="category-tools">
            <h2 id="category-tools" className="text-xl font-extrabold text-fg">
              {live.length} {live.length === 1 ? "tool" : "tools"} ready
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {live.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        ) : (
          <p className="measure max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
            Nothing in this category is finished yet. The tools below are being built — they will
            move up to working links when they are ready.
          </p>
        )}

        {planned.length > 0 ? (
          <section aria-labelledby="category-planned" className="mt-12">
            <h2 id="category-planned" className="text-lg font-bold text-fg">
              In the works
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
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

        <div className="pt-14">
          <AdSlot slot={`category-${category.id}`} minHeight={120} />
        </div>

        <section aria-labelledby="other-categories" className="pt-14">
          <h2 id="other-categories" className="text-lg font-bold text-fg">
            Other categories
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((item) => (
              <Link
                key={item.slug}
                href={`/categories/${item.slug}`}
                className="panel card-interactive group flex items-center justify-between gap-3 p-4 no-underline"
              >
                <span>
                  <span className="block font-display text-[0.9375rem] font-bold text-fg">
                    {item.name}
                  </span>
                  <span className="num mt-0.5 block text-xs text-muted">
                    {countByCategory(item.id).live} tools
                  </span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-accent"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: category.name, path: `/categories/${category.slug}` },
        ])}
      />
      {live.length > 0 ? (
        <JsonLd
          data={itemListJsonLd(
            category.name,
            live.map((tool) => ({ name: tool.name, path: `/tools/${tool.slug}` })),
          )}
        />
      ) : null}
    </>
  );
}
