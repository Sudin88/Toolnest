/**
 * JSON-LD builder. Every object is generated from the tool registry, so
 * structured data can never drift from the visible page content.
 *
 * `serializeJsonLd` escapes `<` so a value containing markup cannot close the
 * script element early.
 */
function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Serialised from our own typed data — nothing here comes from user input.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
