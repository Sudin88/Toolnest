import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

/**
 * The header band used by the static pages — About, Contact and the policies.
 * Tool and category pages have their own richer variants.
 */
export function PageHeader({
  title,
  intro,
  breadcrumb,
  children,
}: {
  title: string;
  intro: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface-2">
      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, ...(breadcrumb ?? []), { label: title }]} />
        <h1 className="mt-5 text-3xl font-extrabold text-fg sm:text-4xl">{title}</h1>
        <p className="measure mt-4 text-[0.9375rem] leading-relaxed text-muted">{intro}</p>
        {children}
      </div>
    </div>
  );
}
