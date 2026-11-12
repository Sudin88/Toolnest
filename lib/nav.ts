import { categories, getCategory } from "@/lib/tools/categories";

/**
 * The navigation, derived from the registry rather than hand-listed.
 *
 * This lives apart from `lib/site.ts` on purpose: deriving the nav means
 * importing `lib/tools/categories`, which statically pulls in the category icon
 * components. `lib/site.ts` is imported widely — including by middleware and by
 * small client surfaces that have no business carrying six icons — so keeping
 * the icons out of that module keeps them out of those bundles.
 *
 * Order follows the registry's own category order. "Daily" is the one exclusion
 * from the primary strip because it is a secondary destination, listed under the
 * footer's "Daily tools" link instead — and that link is derived here too, so no
 * category slug is written down twice.
 *
 * The six glyphs knowingly travel to the client bundle this way, because the
 * mobile menu is a client component and this module is what it imports.
 * Measured, the nav chunk is ~9 KB on the wire against a ~200 KB first load;
 * inlining hand-drawn copies would save about a kilobyte and buy six glyphs free
 * to drift from the icon set they were copied from. Not worth the trade.
 */
export const primaryNav = categories
  .filter((category) => category.id !== "daily")
  .map((category) => ({
    label: category.navLabel,
    href: `/categories/${category.slug}`,
    icon: category.icon,
    color: category.color,
  }));

const daily = getCategory("daily");

export const secondaryNav = [
  { label: "All tools", href: "/tools" },
  { label: "Guides", href: "/guides" },
  { label: `${daily.navLabel} tools`, href: `/categories/${daily.slug}` },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
