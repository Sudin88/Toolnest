import Link from "next/link";
import { notFound } from "next/navigation";

import { GuideCard } from "@/components/guides/guide-card";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolIndexFilter } from "@/components/tools/tool-index-filter";
import { IconTile } from "@/components/ui/icon-tile";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { guidesForCategory } from "@/lib/guides/registry";
import { categories, categoryBySlug } from "@/lib/tools/categories";
import { countByCategory, liveToolsInCategory } from "@/lib/tools/registry";
import { indexGroups } from "@/lib/tools/index-view";

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
  const isEmpty = liveToolsInCategory(category.id).length === 0;

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

  const group = indexGroups().find((entry) => entry.slug === category.slug);
  const tools = liveToolsInCategory(category.id);
  const others = categories.filter((item) => item.id !== category.id);
  const categoryGuides = guidesForCategory(category.id);

  return (
    <>
      <div className="border-b border-line">
        <div className="container-page pb-10 pt-10 sm:pb-12 sm:pt-14">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: category.name }]} />

          <div className="mt-6 flex items-start gap-4">
            <IconTile icon={category.icon} color={category.color} size="lg" />
            <div className="min-w-0">
              <h1 className="text-3xl font-bold leading-tight tracking-[-0.03em] text-fg sm:text-5xl">
                {category.name}
              </h1>
              <p className="mt-2 text-base text-muted">{category.tagline}</p>
            </div>
          </div>

          <p className="measure mt-6 text-[0.9375rem] leading-relaxed text-muted">{category.intro}</p>
        </div>
      </div>

      <div className="container-page pt-12">
        {group ? (
          <ToolIndexFilter groups={[group]} showGroupHeadings={false} />
        ) : (
          <p className="measure text-[0.9375rem] leading-relaxed text-muted">
            Nothing in this category is finished yet. The tools are being built and will appear here
            as working links when they are ready.
          </p>
        )}

        {categoryGuides.length > 0 ? (
          <section aria-labelledby="category-guides" className="pt-14">
            <h2 id="category-guides" className="eyebrow">
              Guides
            </h2>
            <ul className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {categoryGuides.map((guide) => (
                <li key={guide.slug}>
                  <GuideCard guide={guide} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="other-categories" className="pt-14">
          <h2 id="other-categories" className="eyebrow">
            Other categories
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {others.map((item) => {
              const counts = countByCategory(item.id);
              return (
                <li key={item.slug}>
                  <Link href={`/categories/${item.slug}`} className="chip">
                    {item.name}
                    <span className="num text-muted">
                      {counts.live > 0 ? counts.live : "soon"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <JsonLd data={breadcrumbJsonLd([{ name: category.name, path: `/categories/${category.slug}` }])} />
      {tools.length > 0 ? (
        <JsonLd
          data={itemListJsonLd(
            category.name,
            tools.map((tool) => ({ name: tool.name, path: `/tools/${tool.slug}` })),
          )}
        />
      ) : null}
    </>
  );
}
