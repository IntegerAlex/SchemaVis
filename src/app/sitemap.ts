import { MetadataRoute } from 'next';
import { blogs } from '@/lib/blogs/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://schemavis.gossorg.in';

  // Base routes
  const routes = [
    '',
    '/app',
    '/alternatives',
    '/blogs',
    '/contact',
    '/license',
    '/privacy',
    '/terms',
    '/azimutt-vs-schemavis',
    '/chartsdb-vs-schemavis',
    '/dbdiagram-vs-schemavis',
    '/dbeaver-vs-schemavis',
    '/drawdb-vs-schemavis',
    '/drawsql-vs-schemavis',
    '/schemaspy-vs-schemavis',
    '/sqldbm-vs-schemavis',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Blog routes
  const blogRoutes = blogs.map((blog) => ({
    url: `${baseUrl}/blogs/${blog.slug}`,
    lastModified: new Date(blog.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...routes, ...blogRoutes];
}
