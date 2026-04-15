import { ArrowLeft, Calendar, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { blogs } from "@/lib/blogs/data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const blog = blogs.find((b) => b.slug === resolvedParams.slug);

  if (!blog) {
    return {
      title: "Blog Not Found",
    };
  }

  return {
    title: blog.title,
    description: blog.description,
    keywords: blog.keywords,
    authors: [{ name: blog.author }],
    alternates: {
      canonical: `https://schemavis.gossorg.in/blogs/${blog.slug}`,
    },
    openGraph: {
      title: `${blog.title} | SchemaVis Blog`,
      description: blog.description,
      type: "article",
      publishedTime: blog.date,
      authors: [blog.author],
      url: `https://schemavis.gossorg.in/blogs/${blog.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.description,
    },
  };
}

export async function generateStaticParams() {
  return blogs.map((blog) => ({
    slug: blog.slug,
  }));
}

function ArticleJsonLd({ blog }: { blog: (typeof blogs)[number] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.description,
    datePublished: blog.date,
    author: {
      "@type": "Person",
      name: blog.author,
    },
    publisher: {
      "@type": "Organization",
      name: "SchemaVis",
      url: "https://schemavis.gossorg.in",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://schemavis.gossorg.in/blogs/${blog.slug}`,
    },
    keywords: blog.keywords.join(", "),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://schemavis.gossorg.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://schemavis.gossorg.in/blogs",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: blog.title,
        item: `https://schemavis.gossorg.in/blogs/${blog.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const blog = blogs.find((b) => b.slug === resolvedParams.slug);

  if (!blog) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
      {/* Background accents — matching landing page */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.08),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(147,51,234,0.08),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px]" />

      <ArticleJsonLd blog={blog} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
          <Link
            href="/blogs"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
            All Articles
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="SchemaVis logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
          </Link>
        </header>

        <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
          <article>
            <header className="mb-12">
              <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex items-center gap-2 text-sm text-slate-400">
                  <li>
                    <Link
                      href="/"
                      className="hover:text-white transition-colors"
                    >
                      Home
                    </Link>
                  </li>
                  <li className="text-slate-600">/</li>
                  <li>
                    <Link
                      href="/blogs"
                      className="hover:text-white transition-colors"
                    >
                      Blog
                    </Link>
                  </li>
                  <li className="text-slate-600">/</li>
                  <li className="text-slate-200 truncate max-w-[200px]">
                    {blog.title}
                  </li>
                </ol>
              </nav>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400 border-b border-white/10 pb-8">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-xs border border-blue-500/30">
                    {blog.author.charAt(0)}
                  </div>
                  <span className="text-slate-300 font-medium">
                    {blog.author}
                  </span>
                </div>
                <time
                  dateTime={blog.date}
                  className="flex items-center gap-1.5"
                >
                  <Calendar className="size-4" />
                  {new Date(blog.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {blog.readTime}
                </div>
              </div>
            </header>

            <div className="prose prose-invert prose-blue max-w-none prose-headings:font-semibold prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code
                        className="bg-white/10 px-1.5 py-0.5 rounded text-sm text-blue-300 font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {blog.content}
              </ReactMarkdown>
            </div>

            <div className="mt-16 pt-8 border-t border-white/10">
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                Related Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {blog.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center rounded-md bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 border border-white/10"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-3">
              Visualize your schemas effortlessly
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Stop writing manual DDL or guessing relationships. Drop your SQL
              file into SchemaVis and instantly generate an interactive diagram.
            </p>
            <Link
              href="/app"
              className="group inline-flex items-center justify-center rounded-xl bg-slate-900 border border-blue-400/40 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/15 transition-all hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              Try SchemaVis for Free
            </Link>
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
                <Link href="/blogs" className="hover:text-white transition">
                  Blog
                </Link>
                <span className="text-slate-600">•</span>
                <Link href="/app" className="hover:text-white transition">
                  App
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
