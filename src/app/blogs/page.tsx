import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Calendar } from 'lucide-react';
import { blogs } from '@/lib/blogs/data';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Database & SQL Engineering Blog',
  description: 'Technical articles, best practices, and deep dives into database schema design, SQL optimization, indexing, and architecture.',
  openGraph: {
    title: 'Database & SQL Engineering Blog | SchemaVis',
    description: 'Technical articles, best practices, and deep dives into database schema design, SQL optimization, and architecture.',
    url: 'https://schemavis.gossorg.in/blogs',
    type: 'website',
  },
};

export default function BlogsIndexPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/logo.png"
            alt="SchemaVis logo"
            width={80}
            height={80}
            className="h-12 w-12 object-contain scale-150 origin-left"
            priority
          />
        </Link>
        <Link 
          href="/app" 
          className="text-sm font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/20 transition-colors"
        >
          Launch App
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Engineering Blog
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Technical deep dives into relational database architecture, SQL query optimization, schema design patterns, and engineering best practices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {blogs.map((blog) => (
            <article 
              key={blog.slug} 
              className="group relative flex flex-col items-start justify-between bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 rounded-2xl p-6 transition-all"
            >
              <div className="flex items-center gap-x-4 text-xs mb-4 text-slate-400">
                <time dateTime={blog.date} className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {new Date(blog.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </time>
                <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                  <Clock className="size-3.5" />
                  {blog.readTime}
                </div>
              </div>
              <div className="group relative">
                <h3 className="mt-3 text-xl font-semibold leading-6 text-white group-hover:text-blue-400 transition-colors">
                  <Link href={`/blogs/${blog.slug}`}>
                    <span className="absolute inset-0" />
                    {blog.title}
                  </Link>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-400">
                  {blog.description}
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {blog.keywords.slice(0, 3).map(keyword => (
                  <span key={keyword} className="inline-flex items-center rounded-md bg-slate-800/50 px-2 py-1 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/10">
                    {keyword}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}