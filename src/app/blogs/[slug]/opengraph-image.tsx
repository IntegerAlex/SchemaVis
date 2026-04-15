import { ImageResponse } from 'next/og';
import { blogs } from '@/lib/blogs/data';

export const runtime = 'edge';
export const alt = 'SchemaVis Blog';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const blog = blogs.find((b) => b.slug === params.slug);

  if (!blog) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', background: '#020617', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 60, color: 'white' }}>Blog Not Found</div>
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #020617, #0f172a)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ color: '#3b82f6', fontSize: 32, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            SchemaVis Engineering
          </div>
          <div style={{ fontSize: 72, fontWeight: 800, color: 'white', lineHeight: 1.1, marginTop: '20px', maxWidth: '1000px' }}>
            {blog.title}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontSize: 32, fontWeight: 'bold' }}>
              {blog.author.charAt(0)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 32, color: 'white', fontWeight: 600 }}>{blog.author}</div>
              <div style={{ fontSize: 24, color: '#94a3b8' }}>{blog.readTime}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
