'use client';
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import * as React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  type NodeTypes,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TableNode } from './table-node';
import type { Diagram } from '@/lib/domain/diagram';
import { useOptionalCollaboration } from '@/context/collaboration-context';
import { ReactFlowCursors } from './remote-cursors';
import { CommentPinsLayer } from './comments/comment-pin';
import { CommentThread } from './comments/comment-thread';
import { CommentInputBox } from './comments/comment-input-box';
import type { CommentData } from '@/lib/collaboration/types';

interface ChartCanvasProps {
  diagram: Diagram | null;
  showMiniMap?: boolean;
  showControls?: boolean;
  readOnly?: boolean;
  onDiagramChange?: (diagram: Diagram) => void;
  isCommentMode?: boolean;
  onCommentModeChange?: (enabled: boolean) => void;
  navigateToCommentId?: number | null;
  onCommentCreate?: (content: string, x: number, y: number, parentId?: number) => void;
}

const nodeTypes: NodeTypes = {
  table: TableNode as React.ComponentType<any>,
};

export function ChartCanvas({
  diagram,
  showMiniMap = true,
  showControls = true,
  readOnly = false,
  onDiagramChange,
  isCommentMode: externalCommentMode,
  onCommentModeChange,
  navigateToCommentId,
}: ChartCanvasProps) {
  const { fitView, getNode, screenToFlowPosition, setCenter } = useReactFlow();
  const viewport = useViewport();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [internalCommentMode, setInternalCommentMode] = useState(false);
  const [commentInputPosition, setCommentInputPosition] = useState<{ x: number; y: number } | null>(null);
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  
  // Use external comment mode if provided, otherwise use internal state
  const isAddingComment = externalCommentMode !== undefined ? externalCommentMode : internalCommentMode;
  const setIsAddingComment = externalCommentMode !== undefined 
    ? (enabled: boolean) => {
        onCommentModeChange?.(enabled);
      }
    : setInternalCommentMode;
  const containerRef = useRef<HTMLDivElement>(null);
  const sendCursorMoveRef = useRef<((x: number, y: number) => void) | null>(null);
  
  // Collaboration context
  const collaboration = useOptionalCollaboration();
  const canEdit = !readOnly && (collaboration?.canEdit ?? true);
  
  // Update ref when sendCursorMove changes
  useEffect(() => {
    sendCursorMoveRef.current = collaboration?.sendCursorMove ?? null;
  }, [collaboration?.sendCursorMove]);
  
  // Note: Remote node positions not tracked with polling (would require frequent polling)

  const relatedFieldIdsByTable = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!diagram?.relationships) return map;
    for (const rel of diagram.relationships) {
      if (rel.sourceTableId && rel.sourceFieldId) {
        if (!map.has(rel.sourceTableId)) map.set(rel.sourceTableId, new Set());
        map.get(rel.sourceTableId)!.add(rel.sourceFieldId);
      }
      if (rel.targetTableId && rel.targetFieldId) {
        if (!map.has(rel.targetTableId)) map.set(rel.targetTableId, new Set());
        map.get(rel.targetTableId)!.add(rel.targetFieldId);
      }
    }
    return map;
  }, [diagram?.relationships]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Note: With polling-based collaboration, real-time node drags are not supported
  // Node positions are synced when drag ends via diagram updates

  // Track cursor movement for collaboration
  // Store screenToFlowPosition in ref to avoid re-attaching listeners
  const screenToFlowPositionRef = useRef(screenToFlowPosition);
  useEffect(() => {
    screenToFlowPositionRef.current = screenToFlowPosition;
  }, [screenToFlowPosition]);

  useEffect(() => {
    if (!sendCursorMoveRef.current || !containerRef.current) return;

    const container = containerRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!sendCursorMoveRef.current) return;
      
      // Use ReactFlow's built-in coordinate transformation
      // screenToFlowPosition converts screen pixel coordinates to flow coordinates
      const flowPosition = screenToFlowPositionRef.current({
        x: e.clientX,
        y: e.clientY,
      });
      
      sendCursorMoveRef.current(flowPosition.x, flowPosition.y);
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []); // Empty deps - screenToFlowPosition accessed via ref, sendCursorMoveRef is stable

  const tableNodes: Node[] = useMemo(() => {
    if (!diagram || !diagram.tables) {
      return [];
    }

    return diagram.tables.map((table) => ({
      id: table.id,
      type: 'table',
      position: { x: table.x, y: table.y },
      data: {
        table,
        isDimmed: highlightedId !== null && highlightedId !== table.id,
        isExpanded: expandedTables.has(table.id),
        onToggleExpand: () => toggleExpand(table.id),
        relatedFieldIds: relatedFieldIdsByTable.get(table.id) ?? new Set<string>(),
      },
      draggable: true,
      selectable: true,
    }));
  }, [diagram, expandedTables, highlightedId, toggleExpand, relatedFieldIdsByTable]);

  const relationshipEdges: Edge[] = useMemo(() => {
    if (!diagram || !diagram.relationships) {
      return [];
    }

    return diagram.relationships.map((rel) => ({
      id: rel.id,
      source: rel.sourceTableId,
      target: rel.targetTableId,
      sourceHandle: `source-${rel.sourceFieldId}`,
      targetHandle: `target-${rel.targetFieldId}`,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#64748b', strokeWidth: 2 },
      markerEnd: {
        type: 'arrowclosed',
        color: '#64748b',
      },
    }));
  }, [diagram]);

  // Initialize with computed nodes/edges
  const [nodes, setNodes, onNodesChange] = useNodesState(tableNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(relationshipEdges);

  // Keep nodes/edges in sync with computed values (expansion, highlighting, relationships)
  useEffect(() => {
    setNodes(tableNodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNodes]); // setNodes is stable from useNodesState

  useEffect(() => {
    setEdges(relationshipEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationshipEdges]); // setEdges is stable from useEdgesState

  if (!diagram) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
        No diagram to display. Parse SQL to generate a diagram.
      </div>
    );
  }

  // Store collaboration functions in refs to prevent re-renders
  const sendNodeDragRef = useRef<((nodeId: string, x: number, y: number) => void) | null>(null);
  const sendNodeDragEndRef = useRef<((nodeId: string, x: number, y: number) => void) | null>(null);
  const sendCommentCreateRef = useRef<((content: string, x: number, y: number, parentId?: number, diagramContent?: Record<string, unknown>, diagramName?: string, databaseType?: string) => void) | null>(null);

  useEffect(() => {
    sendNodeDragRef.current = collaboration?.sendNodeDrag ?? null;
    sendNodeDragEndRef.current = collaboration?.sendNodeDragEnd ?? null;
    sendCommentCreateRef.current = collaboration?.sendCommentCreate ?? null;
  }, [collaboration?.sendNodeDrag, collaboration?.sendNodeDragEnd, collaboration?.sendCommentCreate]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setHighlightedId(node.id);
      const target = getNode(node.id);
      if (target) {
        fitView({ nodes: [{ id: target.id }], padding: 0.2, duration: 300 });
      }
    },
    [fitView, getNode]
  );

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      // Clear focus/highlight when clicking on empty space
      setHighlightedId(null);
      setSelectedCommentId(null);

      // Handle adding comments
      if (isAddingComment) {
        // Store the screen position and show the comment input box
        setCommentInputPosition({
          x: event.clientX,
          y: event.clientY,
        });
        // Don't disable comment mode yet - wait for submit or cancel
      }
    },
    [isAddingComment]
  );

  // Handle comment submission
  const handleCommentSubmit = useCallback(
    async (content: string) => {
      if (!commentInputPosition || !sendCommentCreateRef.current) return;

      // Convert screen position to flow coordinates for storage
      const flowPosition = screenToFlowPosition({
        x: commentInputPosition.x,
        y: commentInputPosition.y,
      });

      // Include diagram content to auto-create diagram if it doesn't exist
      const diagramContent = diagram ? {
        tables: diagram.tables,
        relationships: diagram.relationships,
        dependencies: diagram.dependencies,
        areas: diagram.areas,
        customTypes: diagram.customTypes,
        notes: diagram.notes,
      } : undefined;

      setIsCreatingComment(true);
      try {
        await sendCommentCreateRef.current(
          content,
          flowPosition.x,
          flowPosition.y,
          undefined, // parentId
          diagramContent,
          diagram?.name || 'Untitled Diagram',
          diagram?.databaseType || 'POSTGRESQL'
        );
        // Close input box and disable comment mode after successful creation
        setCommentInputPosition(null);
        setIsCreatingComment(false);
        setIsAddingComment(false);
      } catch (error) {
        // On error, keep the input box open but stop loading
        console.error('Failed to create comment:', error);
        setIsCreatingComment(false);
      }
    },
    [commentInputPosition, sendCommentCreateRef, screenToFlowPosition, diagram]
  );

  // Handle comment input close
  const handleCommentInputClose = useCallback(() => {
    setCommentInputPosition(null);
    setIsCreatingComment(false);
    setIsAddingComment(false);
  }, []);

  // Handle node drag for collaboration
  const handleNodeDrag = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (canEdit && sendNodeDragRef.current) {
        sendNodeDragRef.current(node.id, node.position.x, node.position.y);
      }
    },
    [canEdit]
  );

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (canEdit && sendNodeDragEndRef.current) {
        sendNodeDragEndRef.current(node.id, node.position.x, node.position.y);
      }

      // Update local diagram
      if (diagram && onDiagramChange) {
        const updatedTables = diagram.tables?.map((table) =>
          table.id === node.id ? { ...table, x: node.position.x, y: node.position.y } : table
        );
        onDiagramChange({ ...diagram, tables: updatedTables });
      }
    },
    [canEdit, diagram, onDiagramChange]
  );

  // Navigate to comment when navigateToCommentId changes
  React.useEffect(() => {
    if (navigateToCommentId && collaboration?.comments) {
      const comment = collaboration.comments.find((c) => c.id === navigateToCommentId);
      if (comment) {
        setSelectedCommentId(navigateToCommentId);
        // Navigate to comment position
        setCenter(comment.x, comment.y, { zoom: Math.max(viewport.zoom, 1) });
      }
    }
  }, [navigateToCommentId, collaboration?.comments, setCenter, viewport.zoom]);

  // Get comments for the selected comment thread
  const selectedComment = React.useMemo(() => {
    if (!selectedCommentId || !collaboration?.comments) return null;
    return collaboration.comments.find((c) => c.id === selectedCommentId) ?? null;
  }, [selectedCommentId, collaboration?.comments]);

  const selectedCommentReplies = React.useMemo(() => {
    if (!selectedCommentId || !collaboration?.comments) return [];
    return collaboration.comments.filter((c) => c.parentId === selectedCommentId);
  }, [selectedCommentId, collaboration?.comments]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={useMemo(() => ({ x: 0, y: 0, zoom: 0.8 }), [])}
        className="w-full h-full"
        nodesDraggable={canEdit}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={useMemo(() => ({ hideAttribution: true }), [])}
        onPaneClick={handlePaneClick}
        style={useMemo(() => ({ cursor: isAddingComment ? 'crosshair' : undefined }), [isAddingComment])}
      >
        <Background />
        {showControls && (
          <Controls
            className="bg-transparent! [&_button]:bg-black [&_button]:text-white [&_button]:border-zinc-700 [&_button]:hover:bg-zinc-900 [&_button]:hover:text-white"
          />
        )}
        {showMiniMap && (
          <MiniMap
            className="rounded-xl border border-white/10 bg-white/0 backdrop-blur-2xl backdrop-saturate-150 shadow-lg shadow-blue-500/15"
            nodeColor={(n) =>
              n.id === highlightedId ? '#60a5fa' : '#94a3b8'
            }
            nodeStrokeColor={(n) =>
              n.id === highlightedId ? '#93c5fd' : '#cbd5e1'
            }
            maskColor="rgba(255,255,255,0.04)"
            pannable
            zoomable
          />
        )}
      </ReactFlow>

      {/* Remote cursors overlay */}
      {collaboration && (
        <ReactFlowCursors />
      )}

      {/* Comment pins overlay */}
      {collaboration && collaboration.comments.length > 0 && (
        <CommentPinsLayer
          comments={collaboration.comments}
          selectedCommentId={selectedCommentId}
          onSelectComment={setSelectedCommentId}
          viewport={viewport}
        />
      )}

      {/* Comment input box */}
      {commentInputPosition && (
        <CommentInputBox
          x={commentInputPosition.x}
          y={commentInputPosition.y}
          onClose={handleCommentInputClose}
          onSubmit={handleCommentSubmit}
          isLoading={isCreatingComment}
        />
      )}

      {/* Selected comment thread popover */}
      {selectedComment && (
        <div
          className="absolute z-50"
          style={{
            left: selectedComment.x * viewport.zoom + viewport.x + 20,
            top: selectedComment.y * viewport.zoom + viewport.y,
          }}
        >
          <CommentThread
            comment={selectedComment}
            replies={selectedCommentReplies}
            onClose={() => setSelectedCommentId(null)}
            currentUserId={collaboration?.currentUser?.id}
          />
        </div>
      )}

      {/* Read-only indicator */}
      {!canEdit && (
        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-xs text-yellow-400">
          View only - You cannot edit this diagram
        </div>
      )}
    </div>
  );
}

// Export toggle for adding comments
export function useCommentMode() {
  const [isAddingComment, setIsAddingComment] = useState(false);
  return { isAddingComment, setIsAddingComment };
}

