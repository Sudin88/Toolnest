/**
 * JSON-LD builder. Every object is generated from the tool registry, so
 * structured data can never drift from the visible page content.
 *
 * `serializeJsonLd` escapes `<` so a value containing markup cannot close the
 * script element early.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- serialised from our own typed data
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
