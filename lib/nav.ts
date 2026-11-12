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
  { label: `${daily.navLabel} tools`, href: `/categories/${daily.slug}` },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
