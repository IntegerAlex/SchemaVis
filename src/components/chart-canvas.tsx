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
import type { CommentData } from '@/lib/collaboration/types';

interface ChartCanvasProps {
  diagram: Diagram | null;
  showMiniMap?: boolean;
  showControls?: boolean;
  readOnly?: boolean;
  onDiagramChange?: (diagram: Diagram) => void;
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
}: ChartCanvasProps) {
  const { fitView, getNode } = useReactFlow();
  const viewport = useViewport();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Collaboration context
  const collaboration = useOptionalCollaboration();
  const canEdit = !readOnly && (collaboration?.canEdit ?? true);
  
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
  useEffect(() => {
    if (!collaboration || !containerRef.current) return;

    const container = containerRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      // Convert to canvas coordinates
      const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
      const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;
      collaboration.sendCursorMove(x, y);
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [collaboration, viewport]);

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
  }, [tableNodes, setNodes]);

  useEffect(() => {
    setEdges(relationshipEdges);
  }, [relationshipEdges, setEdges]);

  if (!diagram) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
        No diagram to display. Parse SQL to generate a diagram.
      </div>
    );
  }

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
      if (isAddingComment && collaboration) {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const x = (event.clientX - rect.left - viewport.x) / viewport.zoom;
        const y = (event.clientY - rect.top - viewport.y) / viewport.zoom;

        const content = prompt('Enter your comment:');
        if (content?.trim()) {
          collaboration.sendCommentCreate(content.trim(), x, y);
        }
        setIsAddingComment(false);
      }
    },
    [isAddingComment, collaboration, viewport]
  );

  // Handle node drag for collaboration
  const handleNodeDrag = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (canEdit && collaboration) {
        collaboration.sendNodeDrag(node.id, node.position.x, node.position.y);
      }
    },
    [canEdit, collaboration]
  );

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (canEdit && collaboration) {
        collaboration.sendNodeDragEnd(node.id, node.position.x, node.position.y);
      }

      // Update local diagram
      if (diagram && onDiagramChange) {
        const updatedTables = diagram.tables?.map((table) =>
          table.id === node.id ? { ...table, x: node.position.x, y: node.position.y } : table
        );
        onDiagramChange({ ...diagram, tables: updatedTables });
      }
    },
    [canEdit, collaboration, diagram, onDiagramChange]
  );

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
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        className="w-full h-full"
        nodesDraggable={canEdit}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
        onPaneClick={handlePaneClick}
        style={{ cursor: isAddingComment ? 'crosshair' : undefined }}
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
        <ReactFlowCursors viewport={viewport} />
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

