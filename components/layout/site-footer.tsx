import Link from "next/link";

import { LogoMark } from "@/components/brand/logo";
import { legalNav, secondaryNav, siteConfig } from "@/lib/site";
import { categories } from "@/lib/tools/categories";
import { countByCategory, liveTools } from "@/lib/tools/registry";

/**
 * The footer closes the page with quiet identity — a large wordmark, the three
 * ways out, and live counts read from the registry so the numbers cannot drift
 * from the tools that actually exist.
 */
export function SiteFooter() {
  const liveCategoryCount = categories.filter(
    (category) => countByCategory(category.id).live > 0,
  ).length;

  return (
    <footer className="mt-20 border-t border-line bg-surface-2 sm:mt-24">
      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.8fr_1fr_1fr_0.9fr] lg:gap-12">
          <div>
            <p className="flex items-center gap-3">
              <LogoMark size={30} />
              <span className="text-3xl font-bold leading-none tracking-[-0.03em] text-fg">
                ToolNest
              </span>
            </p>
            <p className="measure mt-4 text-sm leading-relaxed text-muted">
              {siteConfig.description}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Files are processed on your device, never uploaded. No account, ever.
            </p>
            <p className="mt-5 text-sm">
              <Link
                href={siteConfig.contactEmail ? `mailto:${siteConfig.contactEmail}` : "/contact"}
                className="link"
              >
                {siteConfig.contactEmail || "Contact us"}
              </Link>
            </p>
          </div>

          <nav aria-labelledby="footer-categories">
            <h2 id="footer-categories" className="eyebrow">
              Categories
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {categories.map((category) => {
                const counts = countByCategory(category.id);
                return (
                  <li key={category.slug}>
                    <Link
                      href={`/categories/${category.slug}`}
                      className="inline-flex items-baseline gap-2 text-sm text-muted no-underline transition-colors duration-150 ease-out hover:text-fg"
                    >
                      {category.name}
                      <span className="num text-xs text-muted">
                        {counts.live > 0 ? counts.live : "soon"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav aria-labelledby="footer-explore">
            <h2 id="footer-explore" className="eyebrow">
              Explore
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {secondaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted no-underline transition-colors duration-150 ease-out hover:text-fg"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <h2 id="footer-legal" className="eyebrow">
              Legal
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {legalNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted no-underline transition-colors duration-150 ease-out hover:text-fg"
                  >
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
