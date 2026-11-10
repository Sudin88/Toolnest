import { ArrowRight, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ToolCard } from "@/components/tools/tool-card";
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
      <h1 className="mt-3 text-3xl font-extrabold text-fg sm:text-4xl">
        We could not find that page
      </h1>
      <p className="measure mt-4 text-[0.9375rem] leading-relaxed text-muted">
        The link may be out of date, or the tool behind it has not shipped yet. Everything that works
        is in the directory, and each category page lists what is still being built.
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
        <h2 className="text-sm font-semibold text-fg">Jump to a category</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/categories/${category.slug}`}
                className="inline-flex items-center rounded-full border border-line px-3.5 py-1.5 text-sm text-muted no-underline transition-colors duration-150 ease-out hover:border-line-strong hover:text-fg"
              >
                {category.navLabel}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="notfound-popular" className="mt-14">
        <h2 id="notfound-popular" className="text-lg font-bold text-fg">
          Popular tools
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>
    </div>
  );
}
