'use client';

import { useState } from 'react';
import { LandingPage } from '@/components/landing-page';
import { VisualizerLayout } from '@/components/visualizer-layout';
import { ParseSQLProvider } from '@/context/parse-sql-context';

export default function Home() {
  const [showApp, setShowApp] = useState(false);

  if (!showApp) {
    return <LandingPage onGetStarted={() => setShowApp(true)} />;
  }

  return (
    <ParseSQLProvider>
      <VisualizerLayout />
    </ParseSQLProvider>
  );
}
