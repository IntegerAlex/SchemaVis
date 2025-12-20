/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { ChartCanvas } from '@/components/chart-canvas';
import { Loader2, AlertCircle, ArrowLeft, Lock, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useCollaborationContext } from '@/context/collaboration-context';
import { PresenceAvatars } from '@/components/presence-avatars';
import type { Diagram } from '@/lib/domain/diagram';

export default function SharedDiagramPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { setDiagramId } = useCollaborationContext();

  // Fetch the shared diagram
  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-diagram', token],
    queryFn: async () => {
      const response = await fetch(`/api/diagrams/share/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load diagram');
      }
      return response.json();
    },
    enabled: !!token,
  });

  // Set diagram ID for collaboration
  React.useEffect(() => {
    if (data?.diagram?.id) {
      setDiagramId(data.diagram.id);
    }
    return () => setDiagramId(null);
  }, [data?.diagram?.id, setDiagramId]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="size-8 animate-spin text-blue-400 mb-4" />
        <p className="text-zinc-400">Loading shared diagram...</p>
      </div>
    );
  }

  if (error || !data?.diagram) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="size-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">
            Unable to Load Diagram
          </h1>
          <p className="text-zinc-400 mb-6">
            {error instanceof Error ? error.message : 'The diagram link may be invalid or expired.'}
          </p>
          <Button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="size-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

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

              {/* Presence avatars */}
              <div className="flex items-center gap-4">
                <PresenceAvatars />
                <Button
                  onClick={() => router.push('/')}
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

