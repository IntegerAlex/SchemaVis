"use client";
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import * as React from "react";
import { ChartCanvas } from "./chart-canvas";
import { Button } from "./ui/button";
import { useParseSQLContext } from "@/context/parse-sql-context";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FileText, Loader2, Menu, X, Plus, Github, Pencil } from "lucide-react";
import { ReactFlowProvider } from "@xyflow/react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { SqlFilesSidebar } from "./sql-files-sidebar";
// import { Sidebar } from './ui/sidebar'; // Deprecated: Replaced by header "New Diagram" button
import { SqlInputSidebar } from "./sql-input-sidebar";
// Sharing and collaboration features temporarily disabled
// import { PresenceAvatars, ConnectionStatus } from './presence-avatars';
// import { ShareDialog } from './share-dialog';
// import { CommentsPanel } from './comments/comments-panel';
// import { RightSidebar } from './right-sidebar';
// import { useOptionalCollaboration } from '@/context/collaboration-context';
// import type { CommentData } from '@/lib/collaboration/types';
import { detectDatabaseType } from "@/lib/parsers/detect";
import { DatabaseType } from "@/lib/domain/database-type";
import { useToast } from "./toast";
import type { Diagram } from "@/lib/domain/diagram";
import type { DBTable } from "@/lib/domain/db-table";
import type { DBRelationship } from "@/lib/domain/db-relationship";
import { generateSQL } from "@/lib/sql-generator";

interface VisualizerLayoutProps {
  className?: string;
}

// Helper function to format database type for display
function formatDatabaseTypeForDisplay(
  dbType: DatabaseType | null | undefined,
): string | null {
  if (!dbType) return null;

  // Map DatabaseType enum to readable display names
  const typeMap: Record<DatabaseType, string> = {
    [DatabaseType.GENERIC]: "Generic",
    [DatabaseType.POSTGRESQL]: "PostgreSQL",
    [DatabaseType.MYSQL]: "MySQL",
    [DatabaseType.MARIADB]: "MariaDB",
    [DatabaseType.SQL_SERVER]: "SQL Server",
    [DatabaseType.SQLITE]: "SQLite",
    [DatabaseType.ORACLE]: "Oracle",
  };

  return typeMap[dbType] || null;
}

export function VisualizerLayout({ className }: VisualizerLayoutProps) {
  const { parseMutation } = useParseSQLContext();
  const parsedDiagram = parseMutation.data?.diagram ?? null;
  const [mergedDiagram, setMergedDiagram] = React.useState<Diagram | null>(
    null,
  );
  const diagram = mergedDiagram ?? parsedDiagram;
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(
    null,
  );
  const [detectedDatabaseType, setDetectedDatabaseType] = React.useState<
    string | null
  >(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  // Sharing and collaboration features temporarily disabled
  // const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false);
  // const [isCommentsPanelOpen, setIsCommentsPanelOpen] = React.useState(false);
  // const [navigateToCommentId, setNavigateToCommentId] = React.useState<number | null>(null);
  const [sidebarMode, setSidebarMode] = React.useState<"main" | "sql-input">(
    "main",
  );
  const [sqlInputKey, setSqlInputKey] = React.useState(0);
  const [editMode, setEditMode] = React.useState(false);
  const [editSql, setEditSql] = React.useState("");
  const [editDatabaseType, setEditDatabaseType] = React.useState<DatabaseType>(
    DatabaseType.GENERIC,
  );
  // Sharing and collaboration features temporarily disabled
  // const collaboration = useOptionalCollaboration();
  const { showToast } = useToast();

  // Sync mergedDiagram when parseMutation produces a fresh diagram (e.g. New Diagram)
  React.useEffect(() => {
    if (parsedDiagram && !mergedDiagram) {
      // parsedDiagram changed from null or from a fresh "New Diagram" parse
    }
  }, [parsedDiagram, mergedDiagram]);

  // Merge new SQL into the existing diagram
  const handleMergeSQL = React.useCallback(
    (newSql: string, databaseType: DatabaseType) => {
      if (!diagram) return;

      const newDbType =
        databaseType || diagram.databaseType || DatabaseType.GENERIC;

      // Parse the new SQL via the API
      fetch("/api/parse-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: newSql, databaseType: newDbType }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to parse SQL");
          return res.json();
        })
        .then((data: { diagram: Diagram }) => {
          const newDiagram = data.diagram;
          if (!newDiagram.tables || newDiagram.tables.length === 0) {
            showToast("No tables found in the new SQL", "info");
            return;
          }

          const existingTableNames = new Set(
            (diagram.tables ?? []).map((t) => t.name.toLowerCase()),
          );

          const freshTables = (newDiagram.tables ?? []).filter(
            (t) => !existingTableNames.has(t.name.toLowerCase()),
          );

          if (freshTables.length === 0) {
            showToast("All tables already exist in the diagram", "info");
            return;
          }

          // Offset new tables to avoid overlap with existing ones
          const existingTables = diagram.tables ?? [];
          let maxX = 0;
          for (const t of existingTables) {
            if (t.x + 300 > maxX) maxX = t.x + 300;
          }
          freshTables.forEach((t, i) => {
            t.x = maxX + 100;
            t.y = 100 + i * 350;
          });

          // Combine tables
          const mergedTables: DBTable[] = [...existingTables, ...freshTables];

          // Combine relationships (avoid duplicates by name)
          const existingRelNames = new Set(
            (diagram.relationships ?? []).map((r) => r.name),
          );
          const newRelationships = (newDiagram.relationships ?? []).filter(
            (r) => !existingRelNames.has(r.name),
          );
          const mergedRelationships: DBRelationship[] = [
            ...(diagram.relationships ?? []),
            ...newRelationships,
          ];

          const merged: Diagram = {
            ...diagram,
            tables: mergedTables,
            relationships: mergedRelationships,
          };

          setMergedDiagram(merged);
          showToast(
            `Added ${freshTables.length} table(s) to diagram`,
            "success",
          );
        })
        .catch((err) => {
          console.error("Merge error:", err);
          showToast("Failed to parse new SQL", "error");
        });
    },
    [diagram, showToast],
  );
  // Sharing and collaboration features temporarily disabled
  // const handleShareClick = React.useCallback(() => {
  //   setIsShareDialogOpen(true);
  // }, []);

  // const handleCommentsClick = React.useCallback(() => {
  //   // Intentionally left empty but stable for memoized sidebar
  // }, []);

  // Shared function to handle SQL content loading (from file upload or sidebar)
  const handleSQLContent = React.useCallback(
    (sqlContent: string, fileName: string) => {
      // Detect database type using chartdb's robust detection engine
      const detectedType = detectDatabaseType(sqlContent);
      const displayType = formatDatabaseTypeForDisplay(detectedType);
      if (!displayType) {
        showToast(
          "Could not detect SQL dialect — defaulting to PostgreSQL. You can change this in the selector.",
          "info",
        );
      }
      setDetectedDatabaseType(displayType || "PostgreSQL");
      setSelectedFileName(fileName);

      // Parse the SQL
      parseMutation.mutate({ sql: sqlContent });
    },
    [parseMutation, showToast],
  );

  // Debounced handler for SQL changes from the SQL input sidebar
  // This prevents the entire diagram area from re-parsing on every keystroke,
  // which in turn reduces unnecessary re-renders outside the canvas.
  const sqlChangeDebounceRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const handleSqlInputChange = React.useCallback(
    (sql: string, databaseType: DatabaseType) => {
      // Update the badge when the user explicitly changes the dialect in the sidebar
      const displayType = formatDatabaseTypeForDisplay(databaseType);
      if (displayType) {
        setDetectedDatabaseType(displayType);
      }

      if (sqlChangeDebounceRef.current) {
        clearTimeout(sqlChangeDebounceRef.current);
      }

      sqlChangeDebounceRef.current = setTimeout(() => {
        parseMutation.mutate({ sql, databaseType });
        sqlChangeDebounceRef.current = null;
      }, 400);
    },
    [parseMutation],
  );

  React.useEffect(() => {
    return () => {
      if (sqlChangeDebounceRef.current) {
        clearTimeout(sqlChangeDebounceRef.current);
        sqlChangeDebounceRef.current = null;
      }
    };
  }, []);

  // Clear file info when parsing starts (to show loading state)
  React.useEffect(() => {
    if (parseMutation.isPending) {
      // Keep the filename and database type during parsing
    }
  }, [parseMutation.isPending]);

  // Sharing and collaboration features temporarily disabled
  // // Placeholder diagram ID - in production, this would come from route params or saved state
  // const currentDiagramId = React.useMemo(() => {
  //   // For now, use a static ID or generate one when diagram is loaded
  //   return diagram?.id ?? 'temp-diagram';
  // }, [diagram?.id]);

  // // Initialize collaboration context with diagram ID
  // // Use ref to track previous diagram ID to prevent unnecessary updates
  // const prevDiagramIdRef = React.useRef<string | null>(null);
  // React.useEffect(() => {
  //   if (!collaboration?.setDiagramId) return;
  //
  //   const diagramId = diagram?.id ?? null;
  //
  //   // Clear collaboration context when diagram ID changes (before setting new one)
  //   if (prevDiagramIdRef.current !== null && prevDiagramIdRef.current !== diagramId) {
  //     // Clear the old diagram's collaboration state
  //     collaboration.setDiagramId(null);
  //     // Invalidate queries for the old diagram
  //     queryClient.removeQueries({ queryKey: ['diagram-comments', prevDiagramIdRef.current] });
  //   }
  //
  //   // Only update if diagram ID actually changed
  //   if (prevDiagramIdRef.current !== diagramId) {
  //     prevDiagramIdRef.current = diagramId;
  //     // Set new diagram ID (this will trigger comments refetch)
  //     if (diagramId) {
  //       collaboration.setDiagramId(diagramId);
  //     }
  //   }
  //
  //   return () => {
  //     // Only clear on unmount, not on every change
  //     if (prevDiagramIdRef.current !== null) {
  //       const oldId = prevDiagramIdRef.current;
  //       prevDiagramIdRef.current = null;
  //       collaboration.setDiagramId(null);
  //       queryClient.removeQueries({ queryKey: ['diagram-comments', oldId] });
  //     }
  //   };
  // }, [diagram?.id, collaboration?.setDiagramId, queryClient]);

  // // Navigate to comment location on canvas
  // const handleNavigateToComment = React.useCallback((comment: CommentData) => {
  //   // Close panel
  //   setIsCommentsPanelOpen(false);
  //   // Set comment ID to navigate to - ChartCanvas will handle the navigation
  //   setNavigateToCommentId(comment.id);
  //   // Clear after a short delay to allow re-navigation if needed
  //   setTimeout(() => setNavigateToCommentId(null), 100);
  // }, []);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNewDiagramClick = React.useCallback(() => {
    // Cancel any pending debounced SQL parse to avoid stale re-parses after reset
    if (sqlChangeDebounceRef.current) {
      clearTimeout(sqlChangeDebounceRef.current);
      sqlChangeDebounceRef.current = null;
    }
    setSidebarMode("sql-input");
    setSqlInputKey((prev) => prev + 1);
    setIsMenuOpen(false);
    setSelectedFileName("Untitled SQL");
    setDetectedDatabaseType(null);
    setMergedDiagram(null);
    setEditMode(false);
    parseMutation.reset();
  }, [parseMutation]);

  const handleEditDiagramClick = React.useCallback(() => {
    if (!diagram) return;
    const sql = generateSQL(diagram);
    const dbType = diagram.databaseType || DatabaseType.POSTGRESQL;
    setEditSql(sql);
    setEditDatabaseType(dbType);
    setSidebarMode("sql-input");
    setSqlInputKey((prev) => prev + 1);
    setIsMenuOpen(false);
    setEditMode(true);
  }, [diagram]);

  const handleApplySQL = React.useCallback(
    (sql: string, databaseType: DatabaseType) => {
      if (!sql.trim()) return;

      const detectedType = detectDatabaseType(sql);
      const displayType = formatDatabaseTypeForDisplay(detectedType);
      if (displayType) {
        setDetectedDatabaseType(displayType);
      }

      setMergedDiagram(null);
      setEditMode(false);
      parseMutation.mutate({ sql, databaseType });
    },
    [parseMutation],
  );

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-col bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden",
        className,
      )}
    >
      <header className="w-full px-4 pt-4">
        <div
          className={cn(
            "w-full transition-all duration-300 rounded-2xl border border-white/10",
            "bg-white/5 backdrop-blur-2xl shadow-[0_20px_70px_-30px_rgba(59,130,246,0.45)]",
            isScrolled && "shadow-lg",
          )}
        >
          <div className="px-6 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 max-w-7xl w-full mx-auto">
            <div className="flex h-16 items-center justify-between gap-4">
              {/* Logo + active-file breadcrumb */}
              <div className="flex items-center gap-4 min-w-0">
                <Image
                  src="/logo.png"
                  alt="SchemaVis logo"
                  width={100}
                  height={100}
                  className="h-10 w-10 object-contain"
                  priority
                />
                <a
                  href="https://github.com/IntegerAlex/schemavis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition flex items-center"
                  aria-label="View on GitHub"
                >
                  <Github className="h-8 w-8 sm:h-9 sm:w-9" />
                </a>
                {selectedFileName && !parseMutation.isPending && (
                  <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400 min-w-0">
                    <span className="text-slate-600">/</span>
                    <FileText className="size-3.5 text-blue-400 shrink-0" />
                    <span className="text-slate-300 truncate max-w-[200px]">
                      {selectedFileName}
                    </span>
                    {(detectedDatabaseType ||
                      formatDatabaseTypeForDisplay(diagram?.databaseType)) && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400 font-medium shrink-0">
                          {detectedDatabaseType ||
                            formatDatabaseTypeForDisplay(diagram?.databaseType)}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop actions */}
              <div className="hidden md:flex items-center space-x-3">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10 transition text-slate-100 text-sm">
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>

                {diagram && sidebarMode === "main" && (
                  <Button
                    onClick={handleEditDiagramClick}
                    className="px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all shadow-sm hover:shadow-lg border border-white/10"
                  >
                    <Pencil className="size-4 mr-2" />
                    Edit Diagram
                  </Button>
                )}

                <Button
                  onClick={handleNewDiagramClick}
                  className="px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all shadow-sm hover:shadow-lg border border-white/10"
                >
                  <Plus className="size-4 mr-2" />
                  New Diagram
                </Button>

                <SignedIn>
                  <UserButton afterSignOutUrl="/app" />
                </SignedIn>
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="md:hidden p-2 text-slate-300 hover:bg-slate-800/50 rounded-md transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Mobile menu */}
            <div
              className={cn(
                "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
                isMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="py-4 border-t border-slate-700/70">
                <div className="flex flex-col space-y-2">
                  {diagram && sidebarMode === "main" && (
                    <Button
                      onClick={handleEditDiagramClick}
                      className="w-full px-3 py-2.5 text-sm font-medium bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors border border-white/10"
                    >
                      <Pencil className="size-4 mr-2" />
                      Edit Diagram
                    </Button>
                  )}
                  <Button
                    onClick={handleNewDiagramClick}
                    className="w-full px-3 py-2.5 text-sm font-medium bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors border border-white/10"
                  >
                    <Plus className="size-4 mr-2" />
                    New Diagram
                  </Button>
                  {parseMutation.isPending && (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300">
                      <Loader2 className="size-4 animate-spin text-blue-400" />
                      Parsing…
                    </div>
                  )}
                  <SignedIn>
                    <div className="flex justify-center pt-2">
                      <UserButton afterSignOutUrl="/app" />
                    </div>
                  </SignedIn>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main Sidebar - Deprecated: Replaced by header "New Diagram" button */}
        {/* <Sidebar onNewDiagramClick={() => setSidebarMode('sql-input')} /> */}

        {/* SQL Files Sidebar or SQL Input Sidebar */}
        <SignedIn>
          {sidebarMode === "main" ? (
            <SqlFilesSidebar
              onFileLoad={handleSQLContent}
              activeFileName={selectedFileName}
            />
          ) : (
            <SqlInputSidebar
              key={sqlInputKey}
              onBackClick={() => {
                setSidebarMode("main");
                setEditMode(false);
              }}
              onSqlChange={editMode ? undefined : handleSqlInputChange}
              onApplySQL={editMode ? handleApplySQL : undefined}
              onMergeSQL={editMode ? handleMergeSQL : undefined}
              onFileLoad={editMode ? undefined : handleSQLContent}
              isLoading={parseMutation.isPending}
              error={parseMutation.error?.error}
              editMode={editMode}
              initialSql={editMode ? editSql : undefined}
              initialDatabaseType={editMode ? editDatabaseType : undefined}
            />
          )}
        </SignedIn>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden bg-slate-950 px-4 pb-6 pt-4 relative">
          <div className="h-full w-full rounded-2xl border border-white/10 bg-slate-900">
            <ReactFlowProvider>
              {parseMutation.isPending ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-zinc-300">Parsing SQL...</p>
                  </div>
                </div>
              ) : parseMutation.error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <div className="text-red-400 text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Error Parsing SQL
                    </h3>
                    <p className="text-zinc-300 mb-4">
                      {parseMutation.error.error || "Failed to parse SQL file"}
                    </p>
                    <Button
                      onClick={handleNewDiagramClick}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Try Another File
                    </Button>
                  </div>
                </div>
              ) : (
                <ChartCanvas
                  diagram={diagram}
                  readOnly={false}
                  // Comments feature disabled
                  // navigateToCommentId={navigateToCommentId}
                />
              )}
            </ReactFlowProvider>
          </div>
        </div>

        {/* Sharing and collaboration features temporarily disabled */}
        {/* Right Sidebar */}
        {/* <SignedIn>
            {diagram && (
              <RightSidebar
                onCommentsClick={handleCommentsClick}
                onShareClick={handleShareClick}
                isCommentsOpen={false}
                showShare={!!diagram}
              />
            )}
          </SignedIn> */}
      </div>

      {/* Sharing and collaboration features temporarily disabled */}
      {/* Share Dialog */}
      {/* <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          diagramId={currentDiagramId}
          diagramName={diagram?.name ?? 'Untitled Diagram'}
          diagramContent={diagram ? {
            tables: diagram.tables,
            relationships: diagram.relationships,
            dependencies: diagram.dependencies,
            areas: diagram.areas,
            customTypes: diagram.customTypes,
            notes: diagram.notes,
          } : undefined}
          databaseType={diagram?.databaseType}
        /> */}

      {/* Comments Panel */}
      {/* <CommentsPanel
          isOpen={isCommentsPanelOpen}
          onClose={() => setIsCommentsPanelOpen(false)}
          onNavigateToComment={handleNavigateToComment}
        /> */}
    </div>
  );
}
