import { GuideCard } from "@/components/guides/guide-card";
import { PageHeader } from "@/components/layout/page-header";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { guides, guidesInTopic, guideTopics } from "@/lib/guides/registry";

export const metadata = pageMetadata({
  title: "Guides",
  description:
    "Practical guides to the jobs these tools are built for: merging and splitting PDFs, counting pages, watermarking, and compressing images, all in the browser.",
  path: "/guides",
});

/**
 * The guides index. It is grouped by the same two shelves the tools use for
 * search, so a reader arriving from a PDF query sees PDF writing first, and
 * every entry links straight down into the tools it describes.
 */
export default function GuidesPage() {
  const groups = guideTopics.map((topic) => ({ topic, items: guidesInTopic(topic) }));

  return (
    <>
      <PageHeader
        title="Guides"
        intro={`${guides.length} guides to the jobs behind the tools. Each one explains how a task works, what to watch for, and which tool does it, with no account and nothing to install.`}
      />

      <div className="container-page pt-12">
        <div className="flex flex-col gap-14">
          {groups.map((group) => (
            <section key={group.topic} aria-labelledby={`guides-${group.topic.toLowerCase()}`}>
              <h2 id={`guides-${group.topic.toLowerCase()}`} className="eyebrow">
                {group.topic}
              </h2>
              <ul className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {group.items.map((guide) => (
                  <li key={guide.slug}>
                    <GuideCard guide={guide} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <JsonLd data={breadcrumbJsonLd([{ name: "Guides", path: "/guides" }])} />
      <JsonLd
        data={itemListJsonLd(
          "AllTools guides",
          guides.map((guide) => ({ name: guide.title, path: `/guides/${guide.slug}` })),
        )}
      />
    </>
  );
}
