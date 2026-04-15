import { ArrowRight, Calendar, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { blogs } from "@/lib/blogs/data";

export const metadata: Metadata = {
  title: "Database Schema Design & SQL Engineering Blog",
  description:
    "Expert articles on database schema design, SQL indexing strategies, query optimization, normalization, and relational database architecture. Written for backend engineers and DBAs.",
  keywords: [
    "database schema design",
    "SQL optimization",
    "database indexing",
    "normalization",
    "PostgreSQL",
    "MySQL",
    "ERD",
    "relational database",
    "SQL best practices",
  ],
  alternates: {
    canonical: "https://schemavis.gossorg.in/blogs",
  },
  openGraph: {
    title: "Database Schema Design & SQL Engineering Blog | SchemaVis",
    description:
      "Expert articles on database schema design, SQL indexing, query optimization, and relational database architecture for backend engineers.",
    url: "https://schemavis.gossorg.in/blogs",
    type: "website",
  },
};

function BlogJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Database Schema Design & SQL Engineering Blog",
    description:
      "Expert articles on database schema design, SQL indexing strategies, query optimization, and relational database architecture.",
    url: "https://schemavis.gossorg.in/blogs",
    publisher: {
      "@type": "Organization",
      name: "SchemaVis",
      url: "https://schemavis.gossorg.in",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: blogs.map((blog, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://schemavis.gossorg.in/blogs/${blog.slug}`,
        name: blog.title,
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function BlogsIndexPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
      {/* Background accents — matching landing page */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.08),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.08),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px]" />

      <BlogJsonLd />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="SchemaVis logo"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
          </Link>
          <Link
            href="/app"
            className="group px-5 py-2 rounded-xl bg-slate-900 border border-blue-400/40 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/15 hover:shadow-blue-500/30 hover:-translate-y-0.5"
          >
            Launch App
          </Link>
        </header>

        <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
          <div className="mb-16">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-sm text-slate-400">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li className="text-slate-600">/</li>
                <li className="text-slate-200">Blog</li>
              </ol>
            </nav>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
              Engineering Blog
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
              Technical deep dives into relational database architecture, SQL
              query optimization, schema design patterns, and engineering best
              practices for backend engineers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {blogs.map((blog) => (
              <article
                key={blog.slug}
                className="group relative flex flex-col items-start justify-between rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/[0.07] hover:border-white/15 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-x-4 text-xs mb-4 text-slate-400">
                  <time
                    dateTime={blog.date}
                    className="flex items-center gap-1.5"
                  >
                    <Calendar className="size-3.5" />
                    {new Date(blog.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                    <Clock className="size-3.5" />
                    {blog.readTime}
                  </div>
                </div>
                <div className="relative">
                  <h2 className="mt-3 text-xl font-semibold leading-6 text-white group-hover:text-blue-400 transition-colors">
                    <Link href={`/blogs/${blog.slug}`}>
                      <span className="absolute inset-0" />
                      {blog.title}
                    </Link>
                  </h2>
                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-400">
                    {blog.description}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {blog.keywords.slice(0, 3).map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/10"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Read article <ArrowRight className="size-3" />
                </div>
              </article>
            ))}
          </div>
        </main>

        <footer className="px-6 pb-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <span>© 2025 SchemaVis</span>
                <span className="text-slate-600">•</span>
                <span>GOSSORG</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/" className="hover:text-white transition">
                  Home
                </Link>
                <span className="text-slate-600">•</span>
                <Link href="/app" className="hover:text-white transition">
                  App
                </Link>
                <span className="text-slate-600">•</span>
                <a href="/terms" className="hover:text-white transition">
                  Terms
                </a>
                <span className="text-slate-600">•</span>
                <a href="/privacy" className="hover:text-white transition">
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
