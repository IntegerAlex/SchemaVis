'use client';
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import * as React from 'react';
import {
  FileText,
  Table,
  CodeXml,
  Workflow,
  Group,
  Plus,
  FolderOpen,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from 'lucide-react';
import { Button } from './button';
import { Separator } from './separator';
import { cn } from '@/lib/utils';

interface SidebarItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active: boolean;
}

interface SidebarProps {
  className?: string;
  onSelectSection?: (section: string) => void;
  selectedSection?: string;
}

export function Sidebar({ className, onSelectSection, selectedSection }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  const items: SidebarItem[] = React.useMemo(
    () => [
      {
        title: 'New Diagram',
        icon: Plus,
        onClick: () => {
          // TODO: Implement new diagram
        },
        active: false,
      },
      {
        title: 'Browse',
        icon: FolderOpen,
        onClick: () => {
          // TODO: Implement browse
        },
        active: false,
      },
      {
        title: 'Tables',
        icon: Table,
        onClick: () => {
          onSelectSection?.('tables');
        },
        active: selectedSection === 'tables',
      },
      {
        title: 'DBML',
        icon: CodeXml,
        onClick: () => {
          onSelectSection?.('dbml');
        },
        active: selectedSection === 'dbml',
      },
      {
        title: 'Refs',
        icon: Workflow,
        onClick: () => {
          onSelectSection?.('refs');
        },
        active: selectedSection === 'refs',
      },
      {
        title: 'Visuals',
        icon: Group,
        onClick: () => {
          onSelectSection?.('visuals');
        },
        active: selectedSection === 'visuals',
      },
    ],
    [onSelectSection, selectedSection]
  );

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-r border-zinc-200 dark:border-zinc-800 transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-blue-600 via-indigo-500 to-purple-500 text-white shadow-lg">
              <Sparkles className="size-5" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  ChartDB
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Schema Visualizer
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3">
          <div className="space-y-1 px-2">
            {items.slice(0, 2).map((item) => (
              <button
                key={item.title}
                onClick={item.onClick}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="size-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </button>
            ))}
          </div>

          <Separator className="my-3" />

          <div className="space-y-1 px-2">
            {items.slice(2).map((item) => (
              <button
                key={item.title}
                onClick={item.onClick}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon className="size-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </button>
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
}

