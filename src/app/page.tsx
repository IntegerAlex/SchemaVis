'use client';

import { useState } from 'react';
import { LandingPage } from '@/components/landing-page';
import { VisualizerLayout } from '@/components/visualizer-layout';
import { ParseSQLProvider } from '@/context/parse-sql-context';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export default function Home() {
  const [showApp, setShowApp] = useState(false);

  if (!showApp) {
    return <LandingPage onGetStarted={() => setShowApp(true)} />;
  }

  return (
    <>
      <SignedOut>
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
            <h1 className="text-2xl font-semibold text-white">Sign in required</h1>
            <p className="mt-2 text-sm text-slate-200">
              Please sign in to access the SchemaVis visualizer.
            </p>
            <div className="mt-6">
              <SignInButton mode="modal">
                <button className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 transition">
                  Sign in with Clerk
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <ParseSQLProvider>
          <VisualizerLayout />
        </ParseSQLProvider>
      </SignedIn>
    </>
  );
}
