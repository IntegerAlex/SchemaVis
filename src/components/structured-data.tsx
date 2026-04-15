import React from 'react';

export function GlobalStructuredData() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "SchemaVis",
    "url": "https://schemavis.gossorg.in/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://schemavis.gossorg.in/blogs?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "SchemaVis",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Visualize, explore, and document your database schemas instantly from SQL files. Fast, free, and open-source.",
    "url": "https://schemavis.gossorg.in",
    "image": "https://schemavis.gossorg.in/landing.png"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
    </>
  );
}
