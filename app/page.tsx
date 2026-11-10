import { BadgeCheck, Cpu, UserX } from "lucide-react";

import { AdSlot } from "@/components/ads/ad-slot";
import { GoalsBlock } from "@/components/home/goals-block";
import { Hero } from "@/components/home/hero";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolIndexFilter } from "@/components/tools/tool-index-filter";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { Section, SectionHeading } from "@/components/ui/section";
import { assertContent } from "@/lib/content-check";
import { faqJsonLd, websiteJsonLd } from "@/lib/seo";
import { adsEnabled } from "@/lib/site";
import { indexGroups } from "@/lib/tools/index-view";
import { liveTools } from "@/lib/tools/registry";
import type { Faq } from "@/lib/tools/types";

/**
 * The homepage states what the product is, then hands over the index. Every
 * list here is derived from the registry, so the page cannot advertise a tool
 * that has not been built; the one hand-written list — the goal block — is
 * checked against the registry at build time.
 */

const homeFaqs: Faq[] = [
  {
    q: "Is ToolNest really free?",
    a: "Yes. Every tool is free to use, with no account, no trial period and no paid tier. The site is supported by clearly labelled advertising, which is why you may see an ad slot between sections.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. There is nothing to sign up for and nothing to sign in to. Open a tool, use it, close the tab.",
  },
  {
    q: "Are my files uploaded to a server?",
    a: "Most of these tools process your file inside the browser tab, using the capabilities your device already has. Those tools are marked as running on your device. For anything that genuinely needs a server, the tool page says so before you start — we do not call something private when it is not.",
  },
  {
    q: "How does ToolNest make money if the tools are free?",
    a: "Advertising. Ad slots are reserved, labelled as advertisements and kept away from the controls you are using, so they cannot be mistaken for a button or a download.",
  },
  {
    q: "Do the tools work on a phone?",
    a: "Yes. The layout is built for a narrow screen first, and the file and photo tools use the device's own picker. On mobile, very large documents are limited by the memory of the phone rather than by the tool.",
  },
];

export default function HomePage() {
  assertContent();

  const groups = indexGroups();
  const total = liveTools.length;

  return (
    <>
      <Hero />

      <Section labelId="home-goals">
        <SectionHeading
          id="home-goals"
          title="Which tool do I need?"
          description="Six jobs, in the words you would use for them. Each one points at the tool that does it."
        />
        <div className="mt-8">
          <GoalsBlock />
        </div>
      </Section>

      <Section labelId="tools-index-heading">
        <SectionHeading
          id="tools-index-heading"
          title="The index"
          description={`Every one of the ${total} tools, numbered and grouped by the job it does. Filter by typing, or narrow it to one shelf with a chip.`}
        />

        <div className="mt-8">
          <ToolIndexFilter groups={groups} showCategoryFilter headingLevel="h3" />
        </div>
      </Section>

      {/* The ad band only takes up rhythm when there is an ad to put in it;
          AdSlot itself renders nothing until a publisher id is configured. */}
      {adsEnabled ? (
        <div className="container-page pt-4">
          <AdSlot slot="home-mid" minHeight={120} />
        </div>
      ) : null}

      <Section labelId="home-facts">
        <SectionHeading
          id="home-facts"
          title="Three things, stated plainly"
          description="Not a promise about a future release — each of these is true of the site as it stands today."
        />
        <ul className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
          <Fact
            icon={Cpu}
            title="Your file never leaves the tab"
            body="Every file and photo tool decodes the file on your own device, using what the browser already provides. Nothing is uploaded, and nothing is kept once you close the page."
          />
          <Fact
            icon={UserX}
            title="No account, no email, no dashboard"
            body="There is nothing to sign up for and nothing to sign in to. Open a tool, use it, and close the tab — no address, no password, no profile left behind."
          />
          <Fact
            icon={BadgeCheck}
            title={`All ${total} tools are free`}
            body="Every tool in the index is finished and free to use. There is no trial, no export paywall and no paid tier waiting at the end of the job."
          />
        </ul>
      </Section>

      <Section labelId="home-faq">
        <div className="max-w-3xl">
          <SectionHeading
            id="home-faq"
            title="Questions, answered plainly"
            description="The things people ask before they start — including how the site is paid for."
          />
          <FaqAccordion faqs={homeFaqs} className="mt-8" />
        </div>
      </Section>

      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={faqJsonLd(homeFaqs)} />
    </>
  );
}

function Fact({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Cpu;
  title: string;
  body: string;
}) {
  return (
    <li className="flex flex-col gap-2.5 bg-canvas p-5">
      <span className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-accent" aria-hidden="true" />
        <span className="eyebrow text-fg">{title}</span>
      </span>
      <span className="text-sm leading-relaxed text-muted">{body}</span>
    </li>
  );
}
