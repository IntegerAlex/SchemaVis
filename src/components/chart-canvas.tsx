"use client";
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import * as React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  // useViewport, // Temporarily disabled with collaboration features
  type NodeTypes,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TableNode } from "./table-node";
import type { Diagram } from "@/lib/domain/diagram";
// Sharing and collaboration features temporarily disabled
// import { useOptionalCollaboration } from '@/context/collaboration-context';
// import { ReactFlowCursors } from './remote-cursors';
// import { CommentPinsLayer } from './comments/comment-pin';
// import { CommentThread } from './comments/comment-thread';
// import { CommentInputBox } from './comments/comment-input-box';
import { ContextMenu, createContextMenuItems } from "./context-menu";
import { generateSQL } from "@/lib/sql-generator";
import { useToast } from "./toast";
// import type { CommentData } from '@/lib/collaboration/types';

interface ChartCanvasProps {
  diagram: Diagram | null;
  showMiniMap?: boolean;
  showControls?: boolean;
  readOnly?: boolean;
  onDiagramChange?: (diagram: Diagram) => void;
  // Comments feature disabled
  // isCommentMode?: boolean;
  // onCommentModeChange?: (enabled: boolean) => void;
  // navigateToCommentId?: number | null;
  // onCommentCreate?: (content: string, x: number, y: number, parentId?: number) => void;
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
  // Comments feature disabled
  // isCommentMode: externalCommentMode,
  // onCommentModeChange,
  // navigateToCommentId,
}: ChartCanvasProps) {
  const { fitView, getNode } = useReactFlow();
  // Sharing and collaboration features temporarily disabled
  // const viewport = useViewport();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  // Comments feature disabled
  // const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  // const [internalCommentMode, setInternalCommentMode] = useState(false);
  // const [commentInputPosition, setCommentInputPosition] = useState<{ x: number; y: number } | null>(null);
  // const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Comments feature disabled
  // // Use external comment mode if provided, otherwise use internal state
  // const isAddingComment = externalCommentMode !== undefined ? externalCommentMode : internalCommentMode;
  // const setIsAddingComment = externalCommentMode !== undefined
  //   ? (enabled: boolean) => {
  //       onCommentModeChange?.(enabled);
  //     }
  //   : setInternalCommentMode;
  const isAddingComment = false; // Comments disabled
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Sharing and collaboration features temporarily disabled
  // const sendCursorMoveRef = useRef<((x: number, y: number) => void) | null>(null);
  // const collaboration = useOptionalCollaboration();
  // const canEdit = !readOnly && (collaboration?.canEdit ?? true);
  const canEdit = !readOnly;

  // // Update ref when sendCursorMove changes
  // useEffect(() => {
  //   sendCursorMoveRef.current = collaboration?.sendCursorMove ?? null;
  // }, [collaboration?.sendCursorMove]);

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

  // Sharing and collaboration features temporarily disabled
  // // Track cursor movement for collaboration
  // // Store screenToFlowPosition in ref to avoid re-attaching listeners
  // const screenToFlowPositionRef = useRef(screenToFlowPosition);
  // useEffect(() => {
  //   screenToFlowPositionRef.current = screenToFlowPosition;
  // }, [screenToFlowPosition]);

  // useEffect(() => {
  //   if (!sendCursorMoveRef.current || !containerRef.current) return;
  //
  //   const container = containerRef.current;
  //
  //   const handleMouseMove = (e: MouseEvent) => {
  //     if (!sendCursorMoveRef.current) return;
  //
  //     const flowPosition = screenToFlowPositionRef.current({
  //       x: e.clientX,
  //       y: e.clientY,
  //     });
  //
  //     sendCursorMoveRef.current(flowPosition.x, flowPosition.y);
  //   };
  //
  //   container.addEventListener('mousemove', handleMouseMove, { passive: true });
  //   return () => container.removeEventListener('mousemove', handleMouseMove);
  // }, []);

  const tableNodes: Node[] = useMemo(() => {
    if (!diagram || !diagram.tables) {
      return [];
    }

    return diagram.tables.map((table) => ({
      id: table.id,
      type: "table",
      position: { x: table.x, y: table.y },
      data: {
        table,
        isDimmed: highlightedId !== null && highlightedId !== table.id,
        isExpanded: expandedTables.has(table.id),
        onToggleExpand: () => toggleExpand(table.id),
        relatedFieldIds:
          relatedFieldIdsByTable.get(table.id) ?? new Set<string>(),
      },
      draggable: true,
      selectable: true,
    }));
  }, [
    diagram,
    expandedTables,
    highlightedId,
    toggleExpand,
    relatedFieldIdsByTable,
  ]);

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
      type: "smoothstep",
      animated: false,
      style: { stroke: "#64748b", strokeWidth: 2 },
      markerEnd: {
        type: "arrowclosed",
        color: "#64748b",
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

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setHighlightedId(node.id);
      const target = getNode(node.id);
      if (target) {
        fitView({ nodes: [{ id: target.id }], padding: 0.2, duration: 300 });
      }
    },
    [fitView, getNode],
  );

  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    // Clear focus/highlight when clicking on empty space
    setHighlightedId(null);
    // Comments feature disabled
    // setSelectedCommentId(null);

    // Comments feature disabled
    // // Handle adding comments
    // if (isAddingComment) {
    //   // Store the screen position and show the comment input box
    //   setCommentInputPosition({
    //     x: event.clientX,
    //     y: event.clientY,
    //   });
    //   // Don't disable comment mode yet - wait for submit or cancel
    // }
  }, []);

  // Comments feature disabled
  // // Handle comment submission
  // const handleCommentSubmit = useCallback(
  //   async (content: string) => {
  //     if (!commentInputPosition || !sendCommentCreateRef.current) return;

  //     // Convert screen position to flow coordinates for storage
  //     const flowPosition = screenToFlowPosition({
  //       x: commentInputPosition.x,
  //       y: commentInputPosition.y,
  //     });

  //     // Include diagram content to auto-create diagram if it doesn't exist
  //     const diagramContent = diagram ? {
  //       tables: diagram.tables,
  //       relationships: diagram.relationships,
  //       dependencies: diagram.dependencies,
  //       areas: diagram.areas,
  //       customTypes: diagram.customTypes,
  //       notes: diagram.notes,
  //     } : undefined;

  //     setIsCreatingComment(true);
  //     try {
  //       await sendCommentCreateRef.current(
  //         content,
  //         flowPosition.x,
  //         flowPosition.y,
  //         undefined, // parentId
  //         diagramContent,
  //         diagram?.name || 'Untitled Diagram',
  //         diagram?.databaseType || 'POSTGRESQL'
  //       );
  //       // Close input box and disable comment mode after successful creation
  //       setCommentInputPosition(null);
  //       setIsCreatingComment(false);
  //       setIsAddingComment(false);
  //     } catch (error) {
  //       // On error, keep the input box open but stop loading
  //       console.error('Failed to create comment:', error);
  //       setIsCreatingComment(false);
  //     }
  //   },
  //   [commentInputPosition, sendCommentCreateRef, screenToFlowPosition, diagram]
  // );

  // // Handle comment input close
  // const handleCommentInputClose = useCallback(() => {
  //   setCommentInputPosition(null);
  //   setIsCreatingComment(false);
  //   setIsAddingComment(false);
  // }, []);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    // Get coordinates from the native event
    // ReactFlow's onContextMenu provides the event on the pane, so we need viewport coordinates
    const nativeEvent = e.nativeEvent as MouseEvent;

    // Use clientX/clientY which are viewport-relative (perfect for fixed positioning)
    let x = nativeEvent.clientX;
    let y = nativeEvent.clientY;

    // If native event coordinates are not available, try React synthetic event
    if ((!x && x !== 0) || (!y && y !== 0) || isNaN(x) || isNaN(y)) {
      x = e.clientX;
      y = e.clientY;
    }

    // Final fallback: use pageX/pageY and subtract scroll
    if ((!x && x !== 0) || (!y && y !== 0) || isNaN(x) || isNaN(y)) {
      x = (e.nativeEvent as MouseEvent).pageX - window.scrollX;
      y = (e.nativeEvent as MouseEvent).pageY - window.scrollY;
    }

    // Ensure we have valid coordinates
    if (
      typeof x === "number" &&
      typeof y === "number" &&
      !isNaN(x) &&
      !isNaN(y) &&
      x >= 0 &&
      y >= 0
    ) {
      setContextMenu({ x, y });
    } else {
      // Invalid coordinates, menu will not be shown
    }
  }, []);

  // Handle context menu actions
  // Comments feature disabled
  // const handleAddCommentFromMenu = useCallback(() => {
  //   if (contextMenu) {
  //     setCommentInputPosition({ x: contextMenu.x, y: contextMenu.y });
  //     setContextMenu(null);
  //   }
  // }, [contextMenu]);

  const handleZoomToFit = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
    setContextMenu(null);
  }, [fitView]);

  const handleResetView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
    setContextMenu(null);
  }, [fitView]);

  const handleCopySQL = useCallback(async () => {
    if (!diagram) return;
    try {
      const sql = generateSQL(diagram);
      await navigator.clipboard.writeText(sql);
      showToast("SQL copied to clipboard", "success");
    } catch {
      showToast("Failed to copy SQL", "error");
    }
    setContextMenu(null);
  }, [diagram, showToast]);

  const handleExportSQL = useCallback(() => {
    if (!diagram) return;
    try {
      const sql = generateSQL(diagram);
      const blob = new Blob([sql], { type: "text/sql" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${diagram.name || "schema"}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("SQL file downloaded", "success");
    } catch {
      showToast("Failed to export SQL", "error");
    }
    setContextMenu(null);
  }, [diagram, showToast]);

  // Context menu items - Comments feature disabled
  const contextMenuItems = React.useMemo(
    () =>
      createContextMenuItems({
        // onAddComment: handleAddCommentFromMenu, // Disabled
        onZoomToFit: handleZoomToFit,
        onResetView: handleResetView,
        onCopySQL: diagram ? handleCopySQL : undefined,
        onExportSQL: diagram ? handleExportSQL : undefined,
      }),
    [handleZoomToFit, handleResetView, handleCopySQL, handleExportSQL, diagram],
  );

  // Handle node drag for collaboration
  // Sharing and collaboration features temporarily disabled
  // const handleNodeDrag = useCallback(
  //   (_event: React.MouseEvent, node: Node) => {
  //     if (canEdit && sendNodeDragRef.current) {
  //       sendNodeDragRef.current(node.id, node.position.x, node.position.y);
  //     }
  //   },
  //   [canEdit]
  // );

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Update local diagram
      if (diagram && onDiagramChange) {
        const updatedTables = diagram.tables?.map((table) =>
          table.id === node.id
            ? { ...table, x: node.position.x, y: node.position.y }
            : table,
        );
        onDiagramChange({ ...diagram, tables: updatedTables });
      }
    },
    [diagram, onDiagramChange],
  );

  // Comments feature disabled
  // // Navigate to comment when navigateToCommentId changes
  // React.useEffect(() => {
  //   if (navigateToCommentId && collaboration?.comments) {
  //     const comment = collaboration.comments.find((c) => c.id === navigateToCommentId);
  //     if (comment) {
  //       setSelectedCommentId(navigateToCommentId);
  //       // Navigate to comment position
  //       setCenter(comment.x, comment.y, { zoom: Math.max(viewport.zoom, 1) });
  //     }
  //   }
  // }, [navigateToCommentId, collaboration?.comments, setCenter, viewport.zoom]);

  // // Get comments for the selected comment thread
  // const selectedComment = React.useMemo(() => {
  //   if (!selectedCommentId || !collaboration?.comments) return null;
  //   return collaboration.comments.find((c) => c.id === selectedCommentId) ?? null;
  // }, [selectedCommentId, collaboration?.comments]);

  // const selectedCommentReplies = React.useMemo(() => {
  //   if (!selectedCommentId || !collaboration?.comments) return [];
  //   return collaboration.comments.filter((c) => c.parentId === selectedCommentId);
  // }, [selectedCommentId, collaboration?.comments]);

  // Handle context menu on the container to get correct viewport coordinates
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContainerContextMenu = (e: MouseEvent) => {
      // Only show menu when clicking on the pane background, not on nodes
      const target = e.target as HTMLElement;

      // Check if clicking on a node or node content
      if (target.closest(".react-flow__node") || target.closest("[data-id]")) {
        return; // Don't show context menu on nodes
      }

      // Check if clicking on controls, minimap, or other UI elements
      if (
        target.closest(".react-flow__controls") ||
        target.closest(".react-flow__minimap") ||
        target.closest(".react-flow__background")
      ) {
        e.preventDefault();
        // Use viewport coordinates directly from the native event
        const x = e.clientX;
        const y = e.clientY;
        setContextMenu({ x, y });
      } else if (target.closest(".react-flow")) {
        // Clicking on the ReactFlow pane itself
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        setContextMenu({ x, y });
      }
    };

    container.addEventListener("contextmenu", handleContainerContextMenu, true);
    return () => {
      container.removeEventListener(
        "contextmenu",
        handleContainerContextMenu,
        true,
      );
    };
  }, []);

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.8 }), []);
  const proOptions = useMemo(() => ({ hideAttribution: true }), []);
  const cursorStyle = useMemo(
    () => ({ cursor: isAddingComment ? "crosshair" : undefined }),
    [isAddingComment],
  );

  if (!diagram) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-3">
        <svg
          className="size-12 text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          role="img"
          aria-label="Database icon"
        >
          <title>Database schema</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-3.75"
          />
        </svg>
        <p className="text-sm font-medium">No diagram to display</p>
        <p className="text-xs text-zinc-500">
          Upload or paste SQL to generate a schema visualization
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={defaultViewport}
        className="w-full h-full"
        nodesDraggable={canEdit}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={proOptions}
        onPaneClick={handlePaneClick}
        style={cursorStyle}
      >
        <Background />
        {showControls && (
          <Controls className="bg-transparent! [&_button]:bg-black [&_button]:text-white [&_button]:border-zinc-700 [&_button]:hover:bg-zinc-900 [&_button]:hover:text-white" />
        )}
        {showMiniMap && (
          <MiniMap
            className="rounded-xl border border-white/10 bg-white/0 backdrop-blur-2xl backdrop-saturate-150 shadow-lg shadow-blue-500/15"
            nodeColor={(n) => (n.id === highlightedId ? "#60a5fa" : "#94a3b8")}
            nodeStrokeColor={(n) =>
              n.id === highlightedId ? "#93c5fd" : "#cbd5e1"
            }
            maskColor="rgba(255,255,255,0.04)"
            pannable
            zoomable
          />
        )}
      </ReactFlow>

      {/* Sharing and collaboration features temporarily disabled */}
      {/* Remote cursors overlay */}
      {/* {collaboration && (
        <ReactFlowCursors />
      )} */}

      {/* Comment pins overlay */}
      {/* {collaboration && collaboration.comments.length > 0 && (
        <CommentPinsLayer
          comments={collaboration.comments}
          selectedCommentId={selectedCommentId}
          onSelectComment={setSelectedCommentId}
          viewport={viewport}
        />
      )} */}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Comments feature disabled */}
      {/* Comment input box */}
      {/* {commentInputPosition && (
        <CommentInputBox
          x={commentInputPosition.x}
          y={commentInputPosition.y}
          onClose={handleCommentInputClose}
          onSubmit={handleCommentSubmit}
          isLoading={isCreatingComment}
        />
      )} */}

      {/* Selected comment thread popover */}
      {/* {selectedComment && (
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
      )} */}

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
