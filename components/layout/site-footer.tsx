import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { categories } from "@/lib/tools/categories";
import { countByCategory, liveTools } from "@/lib/tools/registry";
import { legalNav, secondaryNav, siteConfig } from "@/lib/site";

export function SiteFooter() {
  const liveCategoryCount = categories.filter(
    (category) => countByCategory(category.id).live > 0,
  ).length;

  return (
    <footer className="mt-24 border-t border-line bg-surface-2">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[28ch] text-sm text-muted">{siteConfig.description}</p>
            <p className="mt-5 inline-flex items-start gap-2 rounded-md border border-line bg-surface px-3 py-2 text-xs text-muted">
              <ShieldCheck className="mt-px size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>
                Files are processed on your device, never uploaded. No account, ever.
              </span>
            </p>
          </div>

          <nav aria-labelledby="footer-categories">
            <h2 id="footer-categories" className="text-sm font-semibold text-fg">
              Categories
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {categories.map((category) => {
                const counts = countByCategory(category.id);
                return (
                  <li key={category.slug}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="text-sm text-muted no-underline hover:text-fg"
                    >
                      {category.name}
                      <span className="ml-1.5 text-xs text-muted num">
                        {counts.live > 0 ? counts.live : "soon"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="text-sm font-semibold text-fg">
              Explore
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {secondaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted no-underline hover:text-fg">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <h2 id="footer-legal" className="text-sm font-semibold text-fg">
              Legal
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {legalNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted no-underline hover:text-fg">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {siteConfig.name}. Free tools for everyday work.</p>
          <p className="num">
            {liveTools.length} tools live across {liveCategoryCount} categories
          </p>
        </div>
      </div>
    </footer>
  );
}
