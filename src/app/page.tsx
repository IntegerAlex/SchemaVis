'use client';

import { LandingPage } from '@/components/landing-page';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  return <LandingPage onGetStarted={() => router.push('/app')} />;
}
