import type { Faq } from "@/lib/tools/types";

/** The shelf a guide sits on, used to group the index page. */
export type GuideTopic = "PDF" | "Images";

export interface GuideSection {
  /**
   * Written out rather than slugified from the heading, so a table-of-contents
   * link can never drift when the heading is reworded.
   */
  id: string;
  heading: string;
  /** Body copy, rendered in order. */
  body?: string[];
  /** An ordered sequence. Also emitted as HowTo structured data. */
  steps?: string[];
  /** A short list of things that are a list rather than a sequence. */
  bullets?: string[];
  /**
   * A live tool slug to route the reader into at the end of the section. This is
   * the whole point of the section: a guide that never hands over to a tool is
   * just an article. Validated against the registry at load time.
   */
  tool?: string;
}

export interface Guide {
  slug: string;
  /** The H1 and the card title on the index. */
  title: string;
  /** Search-facing `<title>`. Set explicitly, because the H1 reads as prose. */
  metaTitle: string;
  /** Meta description and the index card summary, 120–160 chars, unique. */
  description: string;
  /** ISO date. Shown as the last-reviewed date; drives `dateModified`. */
  updated: string;
  topic: GuideTopic;
  /** Live tool slugs the guide links to. Validated against the registry. */
  tools: string[];
  /** The lede, before the first heading. */
  intro: string[];
  sections: GuideSection[];
  faqs?: Faq[];
}
