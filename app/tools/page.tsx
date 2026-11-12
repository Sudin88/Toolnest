import { JsonLd } from "@/components/seo/json-ld";
import { ToolIndexFilter } from "@/components/tools/tool-index-filter";
import { PageHeader } from "@/components/layout/page-header";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { indexGroups } from "@/lib/tools/index-view";
import { liveTools } from "@/lib/tools/registry";

export const metadata = pageMetadata({
  title: "All tools",
  description: `Browse every free tool on AllTools: ${liveTools.length} utilities for PDFs, images, text, numbers and small daily jobs. No account, and the work happens in your browser.`,
  path: "/tools",
});

export default function ToolsPage() {
  const groups = indexGroups();

  return (
    <>
      <PageHeader
        title="All tools"
        intro={`${liveTools.length} tools, grouped by the job they do. Every one runs without an account, and the file or text you hand it is processed on your device wherever the browser makes that possible.`}
      />

      <div className="container-page pt-12">
        <ToolIndexFilter groups={groups} showCategoryFilter />
      </div>

      <JsonLd data={breadcrumbJsonLd([{ name: "All tools", path: "/tools" }])} />
      <JsonLd
        data={itemListJsonLd(
          "Every AllTools tool",
          liveTools.map((tool) => ({ name: tool.name, path: `/tools/${tool.slug}` })),
        )}
      />
    </>
  );
}
