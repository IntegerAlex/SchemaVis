'use client';

import * as React from 'react';
import { VisualizerLayout } from '@/components/visualizer-layout';
import { ParseSQLProvider } from '@/context/parse-sql-context';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UsernameSetupModal } from '@/components/username-setup-modal';
import { Loader2 } from 'lucide-react';

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

export default function AppPage() {
  const queryClient = useQueryClient();
  const [showUsernameModal, setShowUsernameModal] = React.useState(false);

  // Fetch user info when signed in
  const { data: userInfo, isLoading: isLoadingUser, error } = useQuery<UserInfo>({
    queryKey: ['user', 'me'],
    queryFn: fetchUserInfo,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Check if username is required
  React.useEffect(() => {
    if (userInfo && !userInfo.hasUsername) {
      setShowUsernameModal(true);
    }
  }, [userInfo]);

  const handleUsernameSuccess = React.useCallback(() => {
    // Refetch user info to update state
    queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    setShowUsernameModal(false);
  }, [queryClient]);

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
            {/* Show modal overlay but block access to app */}
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
            {/* Show modal if somehow username is missing */}
            {showUsernameModal && (
              <UsernameSetupModal isOpen={showUsernameModal} onSuccess={handleUsernameSuccess} />
            )}
          </ParseSQLProvider>
        )}
      </SignedIn>
    </>
  );
}
