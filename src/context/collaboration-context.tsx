/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useCollaboration } from '@/hooks/use-collaboration';
import type {
  CollaboratorInfo,
  CursorPosition,
  ConnectionState,
  CommentData,
  Viewport,
} from '@/lib/collaboration/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface CollaborationContextValue {
  // Connection state
  connectionState: ConnectionState;
  diagramId: string | null;
  
  // User info
  currentUser: CollaboratorInfo | null;
  activeUsers: CollaboratorInfo[];
  cursors: Map<string, CursorPosition>;
  
  // Permissions
  canEdit: boolean;
  isOwner: boolean;
  
  // Comments
  comments: CommentData[];
  isLoadingComments: boolean;
  
  // Actions
  setDiagramId: (id: string | null) => void;
  sendCursorMove: (x: number, y: number) => void;
  sendViewportChange: (viewport: Viewport) => void;
  sendNodeDrag: (nodeId: string, x: number, y: number) => void;
  sendNodeDragEnd: (nodeId: string, x: number, y: number) => void;
  sendDiagramUpdate: (content: Record<string, unknown>, version: number) => void;
  sendCommentCreate: (content: string, x: number, y: number, parentId?: number, diagramContent?: Record<string, unknown>, diagramName?: string, databaseType?: string) => void;
  sendCommentResolve: (commentId: number) => void;
  sendCommentDelete: (commentId: number) => void;
  refreshComments: () => void;
  
  // Callbacks for external handlers
  onDiagramUpdate?: (content: Record<string, unknown>, version: number, userId: string) => void;
  setOnDiagramUpdate: (handler: ((content: Record<string, unknown>, version: number, userId: string) => void) | undefined) => void;
  onNodeDrag?: (nodeId: string, x: number, y: number, userId: string) => void;
  setOnNodeDrag: (handler: ((nodeId: string, x: number, y: number, userId: string) => void) | undefined) => void;
  onNodeDragEnd?: (nodeId: string, x: number, y: number, userId: string) => void;
  setOnNodeDragEnd: (handler: ((nodeId: string, x: number, y: number, userId: string) => void) | undefined) => void;
}

const CollaborationContext = React.createContext<CollaborationContextValue | null>(null);

interface CollaborationProviderProps {
  children: React.ReactNode;
}

export function CollaborationProvider({ children }: CollaborationProviderProps) {
  const pathname = usePathname();
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // This ensures hooks are called in the same order on every render
  const [diagramId, setDiagramId] = React.useState<string | null>(null);
  const [comments, setComments] = React.useState<CommentData[]>([]);
  
  // External event handlers - must be called unconditionally
  const [onDiagramUpdateHandler, setOnDiagramUpdateHandler] = React.useState<
    ((content: Record<string, unknown>, version: number, userId: string) => void) | undefined
  >();
  const [onNodeDragHandler, setOnNodeDragHandler] = React.useState<
    ((nodeId: string, x: number, y: number, userId: string) => void) | undefined
  >();
  const [onNodeDragEndHandler, setOnNodeDragEndHandler] = React.useState<
    ((nodeId: string, x: number, y: number, userId: string) => void) | undefined
  >();
  
  const queryClient = useQueryClient();

  // Disable collaboration for shared diagram routes - skip all collaboration features
  const isSharedRoute = pathname?.startsWith('/share/');

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Fetch comments for the diagram - disabled for shared routes
  const { data: commentsData, isLoading: isLoadingComments, refetch: refetchComments } = useQuery({
    queryKey: ['diagram-comments', diagramId],
    queryFn: async () => {
      if (!diagramId) return { comments: [] };
      const response = await fetch(`/api/diagrams/${diagramId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      return response.json();
    },
    enabled: !!diagramId && !isSharedRoute, // Disable for shared routes
  });

  // Update comments state when data changes
  React.useEffect(() => {
    if (commentsData?.comments) {
      setComments(commentsData.comments);
    }
  }, [commentsData]);

  // Handle comment events
  const handleCommentCreated = React.useCallback((comment: CommentData) => {
    setComments((prev) => [...prev, comment]);
  }, []);

  const handleCommentResolved = React.useCallback((commentId: number, resolved: boolean) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, resolved } : c))
    );
  }, []);

  const handleCommentDeleted = React.useCallback((commentId: number) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }, []);

  const collaboration = useCollaboration({
    diagramId,
    enabled: !!diagramId && !isSharedRoute, // Disable for shared routes
    onDiagramUpdate: onDiagramUpdateHandler,
    onNodeDrag: onNodeDragHandler,
    onNodeDragEnd: onNodeDragEndHandler,
    onCommentCreated: handleCommentCreated,
    onCommentResolved: handleCommentResolved,
    onCommentDeleted: handleCommentDeleted,
  });

  const refreshComments = React.useCallback(() => {
    refetchComments();
  }, [refetchComments]);

  // Now we can do conditional returns after all hooks are called
  if (isSharedRoute) {
    // Return a minimal context provider that doesn't enable any collaboration features
    return (
      <CollaborationContext.Provider
        value={{
          connectionState: 'disconnected',
          diagramId: null,
          currentUser: null,
          activeUsers: [],
          cursors: new Map(),
          canEdit: false,
          isOwner: false,
          comments: [],
          isLoadingComments: false,
          setDiagramId: () => {},
          sendCursorMove: () => {},
          sendViewportChange: () => {},
          sendNodeDrag: () => {},
          sendNodeDragEnd: () => {},
          sendDiagramUpdate: () => {},
          sendCommentCreate: () => {},
          sendCommentResolve: () => {},
          sendCommentDelete: () => {},
          refreshComments: () => {},
          setOnDiagramUpdate: () => {},
          setOnNodeDrag: () => {},
          setOnNodeDragEnd: () => {},
        }}
      >
        {children}
      </CollaborationContext.Provider>
    );
  }

  // Memoize context value - extract individual properties instead of depending on entire collaboration object
  const value: CollaborationContextValue = React.useMemo(
    () => ({
      connectionState: collaboration.connectionState,
      diagramId,
      currentUser: collaboration.currentUser,
      activeUsers: collaboration.activeUsers,
      cursors: collaboration.cursors,
      canEdit: collaboration.canEdit,
      isOwner: collaboration.isOwner,
      comments,
      isLoadingComments,
      setDiagramId,
      sendCursorMove: collaboration.sendCursorMove,
      sendViewportChange: collaboration.sendViewportChange,
      sendNodeDrag: collaboration.sendNodeDrag,
      sendNodeDragEnd: collaboration.sendNodeDragEnd,
      sendDiagramUpdate: collaboration.sendDiagramUpdate,
      sendCommentCreate: collaboration.sendCommentCreate,
      sendCommentResolve: collaboration.sendCommentResolve,
      sendCommentDelete: collaboration.sendCommentDelete,
      refreshComments,
      onDiagramUpdate: onDiagramUpdateHandler,
      setOnDiagramUpdate: setOnDiagramUpdateHandler,
      onNodeDrag: onNodeDragHandler,
      setOnNodeDrag: setOnNodeDragHandler,
      onNodeDragEnd: onNodeDragEndHandler,
      setOnNodeDragEnd: setOnNodeDragEndHandler,
    }),
    [
      // Use individual properties instead of entire collaboration object
      collaboration.connectionState,
      collaboration.currentUser,
      collaboration.activeUsers,
      collaboration.cursors,
      collaboration.canEdit,
      collaboration.isOwner,
      collaboration.sendCursorMove,
      collaboration.sendViewportChange,
      collaboration.sendNodeDrag,
      collaboration.sendNodeDragEnd,
      collaboration.sendDiagramUpdate,
      collaboration.sendCommentCreate,
      collaboration.sendCommentResolve,
      collaboration.sendCommentDelete,
      diagramId,
      comments,
      isLoadingComments,
      refreshComments,
      onDiagramUpdateHandler,
      onNodeDragHandler,
      onNodeDragEndHandler,
    ]
  );

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaborationContext() {
  const context = React.useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaborationContext must be used within CollaborationProvider');
  }
  return context;
}

// Optional hook that returns null if not in provider (for components that can work without collaboration)
export function useOptionalCollaboration() {
  return React.useContext(CollaborationContext);
}

