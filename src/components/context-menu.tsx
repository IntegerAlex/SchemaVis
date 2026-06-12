/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
"use client";

import {
  Clipboard,
  Copy,
  Download,
  FileCode,
  MessageCircle,
  RotateCcw,
  ZoomIn,
} from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Calculate position with bounds checking
  // Start with the input coordinates, adjust if needed
  const [position, setPosition] = React.useState(() => ({ x, y }));

  React.useEffect(() => {
    // Update position when x or y changes
    setPosition({ x, y });

    if (!menuRef.current) return;

    // Use requestAnimationFrame to ensure the menu is fully rendered
    const rafId = requestAnimationFrame(() => {
      if (!menuRef.current) return;

      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 8;

      // Only adjust if we have valid dimensions (menu is rendered)
      if (rect.width > 0 && rect.height > 0) {
        let newX = x;
        let newY = y;

        // Adjust horizontal position if menu would overflow
        if (x + rect.width > viewportWidth - padding) {
          newX = Math.max(padding, viewportWidth - rect.width - padding);
        } else if (x < padding) {
          newX = padding;
        }

        // Adjust vertical position if menu would overflow
        if (y + rect.height > viewportHeight - padding) {
          newY = Math.max(padding, viewportHeight - rect.height - padding);
        } else if (y < padding) {
          newY = padding;
        }

        // Update position if it changed
        setPosition({ x: newX, y: newY });
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [x, y]);

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      const enabledItems = items.filter(
        (item) => !item.disabled && !item.divider,
      );
      if (enabledItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % enabledItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + enabledItems.length) % enabledItems.length,
        );
      } else if (e.key === "Enter" && selectedIndex < enabledItems.length) {
        e.preventDefault();
        const item = enabledItems[selectedIndex];
        if (item) {
          item.onClick();
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedIndex, onClose]);

  // Focus first item on mount
  React.useEffect(() => {
    const firstEnabledIndex = items.findIndex(
      (item) => !item.disabled && !item.divider,
    );
    if (firstEnabledIndex >= 0) {
      setSelectedIndex(0);
      itemRefs.current[firstEnabledIndex]?.focus();
    }
  }, [items]);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Use setTimeout to avoid immediate close on right-click
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Filter out dividers for indexing
  const enabledItems = items.filter((item) => !item.disabled && !item.divider);
  const selectedItem = enabledItems[selectedIndex];

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50",
        "min-w-[200px]",
        "bg-white/10 dark:bg-slate-900/40",
        "backdrop-blur-2xl backdrop-saturate-150",
        "border border-white/20 dark:border-white/10",
        "rounded-xl shadow-[0_20px_70px_-30px_rgba(0,0,0,0.5)]",
        "py-2",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        "overflow-hidden",
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        // Ensure the menu is positioned correctly from the start
        transform: "translate(0, 0)",
      }}
      data-debug-position={`x:${position.x},y:${position.y},input:${x},${y}`}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex flex-col">
        {items.map((item, index) => {
          if (item.divider) {
            return (
              <div
                key={item.id}
                className="h-px bg-white/10 my-1 mx-2"
                role="separator"
              />
            );
          }

          const isSelected = selectedItem?.id === item.id;
          const itemIndex = enabledItems.findIndex((i) => i.id === item.id);

          return (
            <button
              key={item.id}
              ref={(el) => {
                if (itemIndex >= 0) {
                  itemRefs.current[itemIndex] = el;
                }
              }}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm",
                "transition-colors duration-150",
                "text-left",
                item.disabled
                  ? "text-zinc-500 cursor-not-allowed opacity-50"
                  : "text-zinc-200 hover:text-white cursor-pointer",
                isSelected && !item.disabled
                  ? "bg-white/10 text-white"
                  : item.disabled
                    ? ""
                    : "hover:bg-white/5",
              )}
              onMouseEnter={() => {
                if (!item.disabled && itemIndex >= 0) {
                  setSelectedIndex(itemIndex);
                }
              }}
            >
              {item.icon && (
                <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                  {item.icon}
                </span>
              )}
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to create common context menu items
export function createContextMenuItems(options: {
  onAddComment?: () => void;
  onZoomToFit?: () => void;
  onResetView?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCopySQL?: () => void;
  onExportSQL?: () => void;
}): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];

  if (options.onAddComment) {
    items.push({
      id: "add-comment",
      label: "Add Comment",
      icon: <MessageCircle className="size-4" />,
      onClick: options.onAddComment,
    });
  }

  if (options.onZoomToFit || options.onResetView) {
    if (items.length > 0) {
      items.push({
        id: "divider-1",
        label: "",
        divider: true,
        onClick: () => {},
      });
    }

    if (options.onZoomToFit) {
      items.push({
        id: "zoom-to-fit",
        label: "Zoom to Fit",
        icon: <ZoomIn className="size-4" />,
        onClick: options.onZoomToFit,
      });
    }

    if (options.onResetView) {
      items.push({
        id: "reset-view",
        label: "Reset View",
        icon: <RotateCcw className="size-4" />,
        onClick: options.onResetView,
      });
    }
  }

  if (options.onCopy || options.onPaste) {
    if (items.length > 0) {
      items.push({
        id: "divider-2",
        label: "",
        divider: true,
        onClick: () => {},
      });
    }

    if (options.onCopy) {
      items.push({
        id: "copy",
        label: "Copy",
        icon: <Copy className="size-4" />,
        onClick: options.onCopy,
      });
    }

    if (options.onPaste) {
      items.push({
        id: "paste",
        label: "Paste",
        icon: <Clipboard className="size-4" />,
        onClick: options.onPaste,
      });
    }
  }

  if (options.onCopySQL || options.onExportSQL) {
    if (items.length > 0) {
      items.push({
        id: "divider-3",
        label: "",
        divider: true,
        onClick: () => {},
      });
    }

    if (options.onCopySQL) {
      items.push({
        id: "copy-sql",
        label: "Copy SQL",
        icon: <FileCode className="size-4" />,
        onClick: options.onCopySQL,
      });
    }

    if (options.onExportSQL) {
      items.push({
        id: "export-sql",
        label: "Export as SQL",
        icon: <Download className="size-4" />,
        onClick: options.onExportSQL,
      });
    }
  }

  return items;
}
