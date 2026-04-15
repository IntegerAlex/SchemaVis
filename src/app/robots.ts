import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/app/diagrams/'],
    },
    sitemap: 'https://schemavis.gossorg.in/sitemap.xml',
  };
}
