'use client';
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import * as React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeTypes,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TableNode } from './table-node';
import type { Diagram } from '@/lib/domain/diagram';

interface ChartCanvasProps {
  diagram: Diagram | null;
  showMiniMap?: boolean;
  showControls?: boolean;
}

const nodeTypes: NodeTypes = {
  table: TableNode as React.ComponentType<any>,
};

export function ChartCanvas({
  diagram,
  showMiniMap = true,
  showControls = true,
}: ChartCanvasProps) {
  const { fitView, getNode } = useReactFlow();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

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

  const handlePaneClick = useCallback(() => {
    // Clear focus/highlight when clicking on empty space
    setHighlightedId(null);
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      maxZoom={2}
      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      className="w-full h-full"
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={true}
      proOptions={{ hideAttribution: true }}
      onPaneClick={handlePaneClick}
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
  );
}

