const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Type2Vibe",
    url: "https://type2vibe.online",
    description:
      "Nền tảng TTS chuyên nghiệp dành riêng cho Tiếng Việt. Phát âm chuẩn xác, tích hợp API dễ dàng.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://type2vibe.online/dictionary?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Type2Vibe",
    url: "https://type2vibe.online",
    logo: "https://type2vibe.online/logo.svg",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Type2Vibe",
    url: "https://type2vibe.online",
    description: "Nền tảng Text-to-Speech Tiếng Việt",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "All",
  },
];

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
