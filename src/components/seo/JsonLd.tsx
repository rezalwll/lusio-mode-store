export function JsonLd({ data }: { data: unknown }) {
  // Escape `<` so product/category copy can never break out of the script tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
