import { ArrowRight, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ToolRow } from "@/components/tools/tool-row";
import { categories } from "@/lib/tools/categories";
import { popularTools } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page does not exist. Browse the full tool directory instead.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const suggestions = popularTools(3);

  return (
    <div className="container-page py-20 sm:py-28">
      <p className="num text-sm font-semibold text-accent-text">404</p>
      <h1 className="mt-3 text-3xl leading-tight tracking-[-0.02em] text-fg sm:text-4xl">
        We could not find that page
      </h1>
      <p className="measure mt-4 text-[0.9375rem] leading-relaxed text-muted">
        The link may be out of date, or the tool behind it has not shipped yet. Everything that works
        is in the directory, grouped by the job it does.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/tools" className="btn btn-primary">
          <Search className="size-4" aria-hidden="true" />
          Browse all tools
        </Link>
        <Link href="/" className="btn btn-secondary">
          Go to the homepage
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <nav aria-label="Categories" className="mt-12">
        <h2 className="eyebrow">Jump to a category</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link href={`/categories/${category.slug}`} className="chip">
                {category.navLabel}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="notfound-popular" className="mt-14">
        <h2 id="notfound-popular" className="eyebrow">
          Popular tools
        </h2>
        <ul className="panel mt-4 divide-y divide-line overflow-hidden">
          {suggestions.map((tool) => (
            <li key={tool.slug}>
              <ToolRow tool={tool} showCategory={false} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
