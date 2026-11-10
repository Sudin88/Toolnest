import type { Faq } from "@/lib/tools/types";

/**
 * A disclosure list built on native <details>. No JavaScript, no focus trap to
 * get wrong, and it works with find-in-page.
 */
export function FaqAccordion({ faqs, className }: { faqs: Faq[]; className?: string }) {
  return (
    <div className={className ? `divide-y divide-line border-y border-line ${className}` : "divide-y divide-line border-y border-line"}>
      {faqs.map((faq, index) => (
        <details key={faq.q} className="group" name="faq" open={index === 0}>
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-[0.9375rem] font-semibold text-fg marker:content-none">
            <span>{faq.q}</span>
            <span
              aria-hidden="true"
              className="relative size-4 shrink-0 text-muted transition-transform duration-150 ease-out group-open:rotate-45"
            >
              <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-current" />
              <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
            </span>
          </summary>
          <p className="max-w-[70ch] pb-4 text-sm leading-relaxed text-muted">{faq.a}</p>
        </details>
      ))}
    </div>
  );
}
