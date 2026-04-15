'use client';

/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import * as React from 'react';
import { useParams } from 'next/navigation';
import { VisualizerLayout } from '@/components/visualizer-layout';
import { ParseSQLProvider } from '@/context/parse-sql-context';
import { SignedIn, SignedOut, SignIn } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UsernameSetupModal } from '@/components/username-setup-modal';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserInfo {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  imageUrl: string | null;
  hasUsername: boolean;
}

async function fetchUserInfo(): Promise<UserInfo> {
  const response = await fetch('/api/user/me');
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  return response.json();
}

export default function DiagramPage() {
  const params = useParams();
  const diagramId = typeof params.id === 'string' ? params.id : null;
  const queryClient = useQueryClient();
  const [showUsernameModal, setShowUsernameModal] = React.useState(false);

  const { data: userInfo, isLoading: isLoadingUser, error } = useQuery<UserInfo>({
    queryKey: ['user', 'me'],
    queryFn: fetchUserInfo,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    if (userInfo && !userInfo.hasUsername) {
      setShowUsernameModal(true);
    }
  }, [userInfo]);

  const handleUsernameSuccess = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    setShowUsernameModal(false);
  }, [queryClient]);

  return (
    <>
      <SignedOut>
        <div className="flex flex-col min-h-screen w-full items-center justify-center bg-[#0A0A0A] px-6 py-12">
          <div className="mb-6 w-full max-w-[400px]">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="size-4" />
              Cancel
            </Link>
          </div>
          <SignIn routing="hash" fallbackRedirectUrl={`/app/diagrams/${diagramId}`} />
        </div>
      </SignedOut>
      <SignedIn>
        {isLoadingUser ? (
          <div className="flex min-h-screen w-full items-center justify-center bg-slate-950">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="size-8 text-blue-400 animate-spin" />
              <p className="text-sm text-zinc-400">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-6">
            <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <h1 className="text-xl font-semibold text-red-400">Error</h1>
              <p className="mt-2 text-sm text-red-300">
                Failed to load user information. Please refresh the page.
              </p>
            </div>
          </div>
        ) : userInfo && !userInfo.hasUsername ? (
          <>
            <div className="flex min-h-screen w-full items-center justify-center bg-slate-950">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="size-8 text-blue-400 animate-spin" />
                <p className="text-sm text-zinc-400">Setting up your account...</p>
              </div>
            </div>
            <UsernameSetupModal isOpen={showUsernameModal} onSuccess={handleUsernameSuccess} />
          </>
        ) : (
          <ParseSQLProvider>
            <VisualizerLayout />
            {showUsernameModal && (
              <UsernameSetupModal isOpen={showUsernameModal} onSuccess={handleUsernameSuccess} />
            )}
          </ParseSQLProvider>
        )}
      </SignedIn>
    </>
  );
}
