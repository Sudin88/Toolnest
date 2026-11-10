import type { Faq } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

/**
 * A disclosure list built on native <details>. No JavaScript, no focus trap to
 * get wrong, and it works with find-in-page. Where the browser supports it, the
 * content height interpolates — see `.accordion` in globals.css.
 */
export function FaqAccordion({ faqs, className }: { faqs: Faq[]; className?: string }) {
  return (
    <div className={cn("accordion divide-y divide-line border-y border-line", className)}>
      {faqs.map((faq, index) => (
        <details key={faq.q} name="faq" open={index === 0} className="group">
          <summary className="flex min-h-16 cursor-pointer list-none items-start justify-between gap-5 py-4 text-[0.9375rem] font-semibold leading-relaxed text-fg marker:content-none">
            <span>{faq.q}</span>
            <span
              aria-hidden="true"
              className="relative mt-1 size-4 shrink-0 text-muted transition-transform duration-200 ease-out group-open:rotate-45"
            >
              <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-current" />
              <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
            </span>
          </summary>
          <p className="measure pb-5 text-[0.9375rem] leading-relaxed text-muted">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}
