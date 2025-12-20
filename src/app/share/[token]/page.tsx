/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { ChartCanvas } from '@/components/chart-canvas';
import { Loader2, AlertCircle, ArrowLeft, Lock, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
// SSE and presence tracking disabled for shared diagrams - just viewing, no cursor tracking
// import { useCollaborationContext } from '@/context/collaboration-context';
import { useDiagramEvents } from '@/context/diagram-events-context';
// import { PresenceAvatars } from '@/components/presence-avatars';
import type { Diagram } from '@/lib/domain/diagram';

export default function SharedDiagramPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  // SSE and presence tracking disabled for shared diagrams
  // const { setDiagramId } = useCollaborationContext();
  const { onDiagramDeleted } = useDiagramEvents();
  const queryClient = useQueryClient();
  
  // Track if diagram is deleted to force re-render
  const [isDeleted, setIsDeleted] = React.useState(false);
  // Track if we've confirmed deletion to prevent any rendering
  const [deletionConfirmed, setDeletionConfirmed] = React.useState(false);
  // Track if query should be disabled (permanent errors)
  const [queryDisabled, setQueryDisabled] = React.useState(false);
  // Track current diagram ID in a ref so we can check it even if data is stale
  const currentDiagramIdRef = React.useRef<string | null>(null);

  // Fetch the shared diagram
  // Disable caching to ensure we always check if diagram is deleted
  // Add timestamp to query key to force fresh fetches
  const [fetchTimestamp, setFetchTimestamp] = React.useState(Date.now());
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['shared-diagram', token, fetchTimestamp],
    queryFn: async () => {
      const response = await fetch(`/api/diagrams/share/${token}`, {
        cache: 'no-store', // Prevent browser caching
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      
      // Check status code first
      if (response.status === 410) {
        // 410 Gone - diagram deleted or expired
        const errorData = await response.json();
        const error = new Error(errorData.error || 'Diagram deleted');
        (error as Error & { errorData?: { error?: string; reason?: string } }).errorData = errorData;
        // Immediately clear any cached data for this query
        queryClient.setQueryData(['shared-diagram', token, fetchTimestamp], undefined);
        throw error;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        // Preserve error details including reason
        const error = new Error(errorData.error || 'Failed to load diagram');
        (error as Error & { errorData?: { error?: string; reason?: string } }).errorData = errorData;
        // Clear cached data on any error
        queryClient.setQueryData(['shared-diagram', token, fetchTimestamp], undefined);
        throw error;
      }
      return response.json();
    },
    enabled: !!token && !queryDisabled, // Disable query if we have a permanent error
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache in memory
    refetchOnMount: !queryDisabled ? 'always' : false, // Don't refetch if disabled
    refetchOnWindowFocus: !queryDisabled, // Don't refetch if disabled
    refetchOnReconnect: !queryDisabled, // Don't refetch if disabled
    refetchInterval: queryDisabled ? false : (query) => {
      // Stop polling if there's an error (especially deletion)
      if (query.state.error) {
        const errorData = query.state.error instanceof Error && 'errorData' in query.state.error
          ? (query.state.error as Error & { errorData?: { error?: string; reason?: string } }).errorData
          : null;
        if (errorData?.reason === 'deleted' || errorData?.reason === 'expired' || errorData?.reason === 'source_deleted') {
          return false; // Stop polling for deleted/expired/source-deleted diagrams
        }
      }
      return 10000; // Refetch every 10 seconds to check if diagram was deleted
    },
    retry: false, // Don't retry on error - show error immediately
  });

  // Clear diagram ID and cache if error indicates deletion
  React.useEffect(() => {
    if (error) {
      const errorData = error instanceof Error && 'errorData' in error
        ? (error as Error & { errorData?: { error?: string; reason?: string } }).errorData
        : null;
      
      if (errorData?.reason === 'deleted' || errorData?.reason === 'expired' || errorData?.reason === 'source_deleted') {
        // Get diagram ID before clearing ref
        const diagramId = currentDiagramIdRef.current || data?.diagram?.id;
        // Immediately mark as deleted to force re-render
        setIsDeleted(true);
        setDeletionConfirmed(true); // Permanent flag - once deleted, always deleted
        setQueryDisabled(true); // Disable query to stop all polling and refetching
        currentDiagramIdRef.current = null; // Clear the ref
        // SSE and presence tracking disabled for shared diagrams
        // setDiagramId(null);
        // CRITICAL: Clear the data immediately to prevent rendering
        queryClient.setQueryData(['shared-diagram', token, fetchTimestamp], undefined);
        // Remove all queries related to this diagram immediately
        queryClient.removeQueries({ queryKey: ['shared-diagram', token] });
        if (diagramId) {
          queryClient.removeQueries({ queryKey: ['diagram-presence', diagramId] });
          queryClient.removeQueries({ queryKey: ['diagram-comments', diagramId] });
        }
        // Cancel any ongoing queries
        queryClient.cancelQueries({ queryKey: ['shared-diagram', token] });
      }
    } else if (!isLoading && data?.diagram && !error) {
      // Reset deletion state if query succeeds and we have valid data
      setIsDeleted(false);
    }
  }, [error, token, queryClient, data?.diagram?.id, isLoading, fetchTimestamp]);

  // SSE and presence tracking disabled for shared diagrams - no collaboration needed
  // Set diagram ID for collaboration - only if not deleted and no error
  // React.useEffect(() => {
  //   if (data?.diagram?.id && !error && !isDeleted) {
  //     setDiagramId(data.diagram.id);
  //   } else {
  //     setDiagramId(null);
  //   }
  //   return () => setDiagramId(null);
  // }, [data?.diagram?.id, error, isDeleted]);

  // Update diagram ID ref when data changes
  React.useEffect(() => {
    if (data?.diagram?.id) {
      currentDiagramIdRef.current = data.diagram.id;
    }
  }, [data?.diagram?.id]);

  // Listen for global diagram deletion events
  React.useEffect(() => {
    const unsubscribe = onDiagramDeleted((deletedDiagramId) => {
      // Check if this matches our current diagram (use ref to avoid stale closure)
      const currentId = currentDiagramIdRef.current || data?.diagram?.id;
      if (currentId === deletedDiagramId) {
        console.log('Diagram deleted globally, updating shared page immediately');
        // Immediately mark as deleted to force re-render
        setIsDeleted(true);
        setDeletionConfirmed(true); // Permanent flag - once deleted, always deleted
        currentDiagramIdRef.current = null; // Clear the ref
        // SSE and presence tracking disabled for shared diagrams
        // setDiagramId(null);
        // Clear the data immediately to prevent rendering
        queryClient.setQueryData(['shared-diagram', token, fetchTimestamp], undefined);
        // Remove all queries related to this diagram immediately
        queryClient.removeQueries({ queryKey: ['shared-diagram', token] });
        queryClient.removeQueries({ queryKey: ['diagram-presence', deletedDiagramId] });
        queryClient.removeQueries({ queryKey: ['diagram-comments', deletedDiagramId] });
        // Invalidate all queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['shared-diagram', token] });
      }
    });

    return unsubscribe;
  }, [onDiagramDeleted, data?.diagram?.id, token, fetchTimestamp, queryClient]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="size-8 animate-spin text-blue-400 mb-4" />
        <p className="text-zinc-400">Loading shared diagram...</p>
      </div>
    );
  }

  // Don't render diagram if there's an error, no data, or diagram is deleted
  // Check for deletion/expiration errors first, even if data exists
  const hasDeletionError = error && error instanceof Error && 'errorData' in error
    ? (error as Error & { errorData?: { error?: string; reason?: string } }).errorData?.reason === 'deleted' ||
      (error as Error & { errorData?: { error?: string; reason?: string } }).errorData?.reason === 'expired' ||
      (error as Error & { errorData?: { error?: string; reason?: string } }).errorData?.reason === 'source_deleted'
    : false;

  // CRITICAL: Force error state if diagram is marked as deleted
  // Also check if data exists but we have a deletion error (React Query might keep stale data)
  // deletionConfirmed is a permanent flag - once set, never render the diagram
  if (deletionConfirmed || isDeleted || error || !data?.diagram || hasDeletionError || (error && data)) {
    // Extract error reason from the error response
    let errorMessage = 'The diagram link may be invalid or expired.';
    let errorTitle = 'Unable to Load Diagram';
    let ErrorIconComponent: typeof AlertCircle = AlertCircle;

    if (error) {
      // Try to get error details from the error object
      const errorData = error instanceof Error && 'errorData' in error
        ? (error as Error & { errorData?: { error?: string; reason?: string } }).errorData
        : null;
      
      if (errorData?.reason === 'deleted' || isDeleted || deletionConfirmed) {
        errorTitle = 'Diagram Deleted';
        errorMessage = 'This diagram has been deleted by the owner and is no longer available.';
        ErrorIconComponent = AlertCircle;
      } else if (errorData?.reason === 'source_deleted') {
        errorTitle = 'File Deleted';
        errorMessage = 'The file might be deleted or owner has changed the access.';
        ErrorIconComponent = AlertCircle;
      } else if (errorData?.reason === 'expired') {
        errorTitle = 'Link Expired';
        errorMessage = 'This share link has expired and is no longer valid.';
        ErrorIconComponent = AlertCircle;
      } else if (errorData?.reason === 'not_public') {
        errorTitle = 'Access Denied';
        errorMessage = 'This diagram is no longer publicly shared.';
        ErrorIconComponent = Lock;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
    } else if (isDeleted || deletionConfirmed) {
      errorTitle = 'Diagram Deleted';
      errorMessage = 'This diagram has been deleted by the owner and is no longer available.';
      ErrorIconComponent = AlertCircle;
    }

    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="text-center max-w-md">
          <ErrorIconComponent className="size-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">
            {errorTitle}
          </h1>
          <p className="text-zinc-400 mb-6">
            {errorMessage}
          </p>
          <Button
            onClick={() => router.push('/app')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="size-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Only render diagram if we have valid data, no error, and not deleted
  // This is a safety check - the error check above should have already returned
  // deletionConfirmed is a permanent flag - once set, never render
  // CRITICAL: Double-check deletionConfirmed before using any data
  if (deletionConfirmed || isDeleted) {
    // Force error state - don't render diagram even if data exists
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="size-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">
            Diagram Deleted
          </h1>
          <p className="text-zinc-400 mb-6">
            This diagram has been deleted by the owner and is no longer available.
          </p>
          <Button
            onClick={() => router.push('/app')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="size-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Only proceed if we have valid data and no deletion flags
  if (!error && data?.diagram && !deletionConfirmed && !isDeleted) {
    const diagram: Diagram = {
      id: data.diagram.id,
      name: data.diagram.name,
      databaseType: data.diagram.databaseType,
      ...(data.diagram.content as Record<string, unknown>),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return (
      <div className="flex h-screen w-screen flex-col bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
        {/* Header */}
        <header className="w-full px-4 pt-4">
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_70px_-30px_rgba(59,130,246,0.45)]">
            <div className="px-6 max-w-7xl w-full mx-auto">
              <div className="flex h-16 items-center justify-between gap-4">
                {/* Logo and diagram info */}
                <div className="flex items-center gap-4">
                  <Image
                    src="/logo.png"
                    alt="SchemaVis logo"
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain"
                    priority
                  />
                  <div>
                    <h1 className="text-lg font-semibold text-white">
                      {data.diagram.name}
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      {data.canEdit ? (
                        <>
                          <Edit className="size-3" />
                          <span>Can edit</span>
                        </>
                      ) : (
                        <>
                          <Eye className="size-3" />
                          <span>View only</span>
                        </>
                      )}
                      <span className="text-zinc-600">•</span>
                      <span>{data.diagram.databaseType}</span>
                    </div>
                  </div>
                </div>

                {/* Presence avatars - disabled for shared diagrams */}
                <div className="flex items-center gap-4">
                  {/* <PresenceAvatars /> */}
                  <Button
                    onClick={() => router.push('/app')}
                    variant="ghost"
                    className="text-zinc-400 hover:text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="size-4 mr-2" />
                    Back
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden px-4 pb-6 pt-4">
          <div className="h-full w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_70px_-30px_rgba(59,130,246,0.45)]">
            <ReactFlowProvider>
              <ChartCanvas
                diagram={diagram}
                readOnly={!data.canEdit}
              />
            </ReactFlowProvider>
          </div>
        </div>
      </div>
    );
  }

  // Fallback: If we somehow reach here without valid data, show error
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="text-center max-w-md">
        <AlertCircle className="size-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-white mb-2">
          Unable to Load Diagram
        </h1>
        <p className="text-zinc-400 mb-6">
          The diagram link may be invalid or expired.
        </p>
        <Button
          onClick={() => router.push('/app')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <ArrowLeft className="size-4 mr-2" />
          Go Home
        </Button>
      </div>
    </div>
  );
}

