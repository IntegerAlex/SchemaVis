'use client';
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import { memo, useMemo } from 'react';
import { Handle, type NodeProps, Position, type Node } from '@xyflow/react';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import { cn } from '@/lib/utils';

interface TableNodeData extends Record<string, unknown> {
  table: DBTable;
  isDimmed?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  relatedFieldIds?: Set<string>;
}

type TableNodeType = Node<TableNodeData, 'table'>;

export const TableNode = memo((props: NodeProps<TableNodeType>) => {
  const { data, selected, dragging } = props;
  const { table, isDimmed, isExpanded, onToggleExpand, relatedFieldIds } = data;
  const maxCollapsed = 10;

  const visibleFields: DBField[] = useMemo(() => {
    if (isExpanded || table.fields.length <= maxCollapsed) return table.fields;

    const required = table.fields.filter(
      (f: DBField) => f.primaryKey || relatedFieldIds?.has(f.id)
    );
    const optional = table.fields.filter(
      (f: DBField) => !(f.primaryKey || relatedFieldIds?.has(f.id))
    );

    const keepRequired = required.slice(0, maxCollapsed);
    const remainingSlots = maxCollapsed - keepRequired.length;
    const keepOptional = remainingSlots > 0 ? optional.slice(0, remainingSlots) : [];

    const keepSet = new Set([...keepRequired, ...keepOptional]);
    return table.fields.filter((f: DBField) => keepSet.has(f));
  }, [isExpanded, table.fields, relatedFieldIds]);

  const isCollapsed = !isExpanded && table.fields.length > maxCollapsed;

  return (
    <div
      className={cn(
        'relative bg-white dark:bg-zinc-800 border-2 rounded-lg shadow-lg min-w-[200px] transition-all',
        selected
          ? 'z-20 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/30 brightness-110 contrast-110 shadow-xl'
          : 'z-0 border-zinc-300 dark:border-zinc-600',
        dragging && 'opacity-80',
        isDimmed && !selected ? 'opacity-50 brightness-75' : ''
      )}
    >
      {/* Table Header */}
      <div
        className="px-4 py-2 font-semibold text-white rounded-t-lg"
        style={{ backgroundColor: table.color }}
      >
        <div className="text-sm">{table.schema && `${table.schema}.`}</div>
        <div className="text-base">{table.name}</div>
      </div>

      {/* Fields */}
      <div
        className="relative divide-y divide-zinc-200 dark:divide-zinc-700"
      >
        {visibleFields.map((field) => (
          <div
            key={field.id}
            className="px-4 py-2 text-sm flex items-center justify-between relative"
          >
            {/* Source handle (right side) for outgoing relationships */}
            <Handle
              type="source"
              position={Position.Right}
              id={`source-${field.id}`}
              className="w-3 h-3 bg-blue-500"
            />
            {/* Target handle (left side) for incoming relationships */}
            <Handle
              type="target"
              position={Position.Left}
              id={`target-${field.id}`}
              className="w-3 h-3 bg-green-500"
            />
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {field.name}
              </span>
              {field.primaryKey && (
                <span className="text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded">
                  PK
                </span>
              )}
              {field.unique && !field.primaryKey && (
                <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                  UQ
                </span>
              )}
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {field.type.name}
              {field.characterMaximumLength &&
                `(${field.characterMaximumLength})`}
              {field.precision &&
                field.scale &&
                `(${field.precision},${field.scale})`}
              {!field.nullable && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </span>
          </div>
        ))}
        {table.fields.length > maxCollapsed && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="w-full px-4 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline text-center transition-colors bg-blue-50/40 dark:bg-blue-900/20"
          >
            {isExpanded ? 'Show less' : `+${table.fields.length - maxCollapsed} more fields`}
          </button>
        )}
      </div>
    </div>
  );
});

TableNode.displayName = 'TableNode';

