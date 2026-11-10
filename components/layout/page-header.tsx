import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

/**
 * The header band used by the static pages — About, Contact, the policies and
 * the full tool list. It is deliberately light: a rule, a serif title and a
 * comfortable measure, so long prose starts close to the top of the page.
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
    <div className="border-b border-line">
      <div className="container-page pb-10 pt-10 sm:pb-12 sm:pt-14">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, ...(breadcrumb ?? []), { label: title }]} />
        <h1 className="mt-6 text-3xl leading-tight tracking-[-0.02em] text-fg sm:text-4xl">
          {title}
        </h1>
        <p className="measure mt-4 text-[0.9375rem] leading-relaxed text-muted sm:text-base">
          {intro}
        </p>
        {children}
      </div>
    </div>
  );
}
