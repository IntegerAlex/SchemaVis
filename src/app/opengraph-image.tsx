import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'SchemaVis - Free Open Source Database Schema Visualizer';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #020617, #0f172a)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'white',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          SchemaVis
        </div>
        <div
          style={{
            fontSize: 40,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '900px',
          }}
        >
          Free Open Source Database Schema Visualizer
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
