import type { LucideIcon } from "lucide-react";

export type ToolCategoryId =
  | "pdf"
  | "image"
  | "text"
  | "calculators"
  | "developer"
  | "daily";

/**
 * `planned` tools are declared (so the roadmap and internal links stay honest)
 * but are not routed, linked, searched or added to the sitemap. Nothing on the
 * site advertises a tool as working until it is `live`.
 */
export type ToolStatus = "live" | "planned";

export interface Faq {
  q: string;
  a: string;
}

export interface ToolDefinition {
  slug: string;
  name: string;
  category: ToolCategoryId;
  /** One line, ~60 chars, used on the tool card. */
  tagline: string;
  /** Meta description, 120–160 chars, unique per tool. */
  description: string;
  icon: LucideIcon;
  /** Terms a visitor might search for to find this tool. */
  keywords: string[];
  /** True when the tool never sends input off the device. */
  local: boolean;
  status: ToolStatus;
  /** Higher shows earlier in “Popular tools”. */
  rank: number;
  /** ISO date, drives “Recently added”. */
  added: string;
  /** Rendered under the workspace as editorial instructions. Live tools only. */
  howTo?: string[];
  /** Rendered as an accessible accordion, and as FAQPage structured data. Live tools only. */
  faqs?: Faq[];
  /** Topics the tool cannot do, stated up front rather than discovered by failing. */
  limits?: string[];
}

export interface ToolCategory {
  id: ToolCategoryId;
  slug: string;
  name: string;
  /** Nav label. */
  navLabel: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** Opening paragraph on the category page. */
  intro: string;
}
