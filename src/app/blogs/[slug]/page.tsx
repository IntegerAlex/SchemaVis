import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { blogs } from '@/lib/blogs/data';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const blog = blogs.find(b => b.slug === resolvedParams.slug);
  
  if (!blog) {
    return {
      title: 'Blog Not Found',
    };
  }

  return {
    title: blog.title,
    description: blog.description,
    keywords: blog.keywords,
    authors: [{ name: blog.author }],
    openGraph: {
      title: `${blog.title} | SchemaVis Blog`,
      description: blog.description,
      type: 'article',
      publishedTime: blog.date,
      authors: [blog.author],
      url: `https://schemavis.gossorg.in/blogs/${blog.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.description,
    }
  };
}

export async function generateStaticParams() {
  return blogs.map((blog) => ({
    slug: blog.slug,
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const blog = blogs.find((b) => b.slug === resolvedParams.slug);

  if (!blog) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full border-b border-white/5">
        <Link href="/blogs" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="size-4" />
          Back to Blogs
        </Link>
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/logo.png"
            alt="SchemaVis logo"
            width={80}
            height={80}
            className="h-8 w-8 object-contain scale-150 origin-right"
            priority
          />
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <article>
          <header className="mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400 border-b border-white/10 pb-8">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-xs border border-blue-500/30">
                  {blog.author.charAt(0)}
                </div>
                <span className="text-slate-300 font-medium">{blog.author}</span>
              </div>
              <time dateTime={blog.date} className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {new Date(blog.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </time>
              <div className="flex items-center gap-1.5">
                <Clock className="size-4" />
                {blog.readTime}
              </div>
            </div>
          </header>

          <div className="prose prose-invert prose-blue max-w-none prose-headings:font-semibold prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-pre:bg-[#1E1E1E] prose-pre:border prose-pre:border-white/10">
            <ReactMarkdown
              components={{
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus as any}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm text-blue-300 font-mono" {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {blog.content}
            </ReactMarkdown>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Related Topics</h3>
            <div className="flex flex-wrap gap-2">
              {blog.keywords.map(keyword => (
                <span key={keyword} className="inline-flex items-center rounded-md bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 border border-white/10">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </article>
        
        <div className="mt-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-3">Visualize your schemas effortlessly</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">Stop writing manual DDL or guessing relationships. Drop your SQL file into SchemaVis and instantly generate an interactive diagram.</p>
          <Link href="/app" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors">
            Try SchemaVis for Free
          </Link>
        </div>
      </main>
    </div>
  );
}