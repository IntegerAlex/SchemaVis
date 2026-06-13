"use client";

/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { ReactFlowProvider } from "@xyflow/react";
import {
  Copy,
  Download,
  FileImage,
  FileText,
  Github,
  Image as ImageIcon,
  Loader2,
  Menu,
  Pencil,
  Plus,
  Redo2,
  Undo2,
  X,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { useParseSQLContext } from "@/context/parse-sql-context";
import { useDiagramHistory } from "@/hooks/use-diagram-history";
import { DatabaseType } from "@/lib/domain/database-type";
import type { DBTable } from "@/lib/domain/db-table";
import type { Diagram } from "@/lib/domain/diagram";
import { downloadPng, downloadSvg } from "@/lib/export-diagram";
import { detectDatabaseType } from "@/lib/parsers/detect";
import { generateSQL } from "@/lib/sql-generator";
import { cn } from "@/lib/utils";
import { ChartCanvas } from "./chart-canvas";
import { SqlFilesSidebar } from "./sql-files-sidebar";
import { SqlInputSidebar } from "./sql-input-sidebar";
import { ThemeSelector } from "./theme-selector";
import { useToast } from "./toast";
import { Button } from "./ui/button";

interface VisualizerLayoutProps {
  className?: string;
}

function formatDatabaseTypeForDisplay(
  dbType: DatabaseType | null | undefined,
): string | null {
  if (!dbType) return null;
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

function normalizeName(s: string): string {
  return s.replace(/["`[\]]/g, "").toLowerCase();
}

function tableKey(t: DBTable): string {
  return `${normalizeName(t.schema || "public")}.${normalizeName(t.name)}`;
}

export function VisualizerLayout({ className }: VisualizerLayoutProps) {
  const { parseMutation } = useParseSQLContext();
  const parsedDiagram = parseMutation.data?.diagram ?? null;

  const {
    diagram,
    pushSnapshot,
    undo,
    redo,
    reset: resetHistory,
    canUndo,
    canRedo,
  } = useDiagramHistory(null);

  const pendingMergeRef = React.useRef<Diagram | null>(null);

  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(
    null,
  );
  const [detectedDatabaseType, setDetectedDatabaseType] = React.useState<
    string | null
  >(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [sidebarMode, setSidebarMode] = React.useState<"main" | "sql-input">(
    "main",
  );
  const [sqlInputKey, setSqlInputKey] = React.useState(0);
  const [editMode, setEditMode] = React.useState(false);
  const [editSql, setEditSql] = React.useState("");
  const [editDatabaseType, setEditDatabaseType] = React.useState<DatabaseType>(
    DatabaseType.GENERIC,
  );
  const [isExporting, setIsExporting] = React.useState<"png" | "svg" | null>(
    null,
  );
  const { showToast } = useToast();

  // Push parsed diagram to history when it changes
  React.useEffect(() => {
    if (parsedDiagram) {
      if (pendingMergeRef.current) {
        // Merge mode: keep existing tables, only add new ones
        const existing = pendingMergeRef.current;
        pendingMergeRef.current = null;

        const existingTableKeys = new Set(
          (existing.tables ?? []).map(tableKey),
        );
        const newTables = (parsedDiagram.tables ?? []).filter(
          (t) => !existingTableKeys.has(tableKey(t)),
        );

        if (newTables.length === 0) {
          pushSnapshot(existing);
          setEditMode(false);
          setSidebarMode("main");
          showToast("No new tables to add", "info");
          return;
        }

        let maxX = 0;
        for (const t of existing.tables ?? []) {
          if (t.x + 300 > maxX) maxX = t.x + 300;
        }
        newTables.forEach((t, i) => {
          t.x = maxX + 100;
          t.y = 100 + i * 350;
        });

        const existingRelKeys = new Set(
          (existing.relationships ?? []).map((r) => normalizeName(r.name)),
        );
        const newRels = (parsedDiagram.relationships ?? []).filter(
          (r) => !existingRelKeys.has(normalizeName(r.name)),
        );

        const merged: Diagram = {
          ...existing,
          tables: [...(existing.tables ?? []), ...newTables],
          relationships: [...(existing.relationships ?? []), ...newRels],
        };

        pushSnapshot(merged);
        setEditMode(false);
        setSidebarMode("main");
        showToast(`Added ${newTables.length} table(s)`, "success");
        return;
      }

      // Normal parse — push to history
      pushSnapshot(parsedDiagram);
    }
  }, [parsedDiagram, pushSnapshot, showToast]);

  // Keyboard shortcuts for undo/redo
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey && canUndo) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey && canRedo) {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "y" && canRedo) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const handleSQLContent = React.useCallback(
    (sqlContent: string, fileName: string) => {
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
      parseMutation.mutate({ sql: sqlContent });
    },
    [parseMutation, showToast],
  );

  const sqlChangeDebounceRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const handleSqlInputChange = React.useCallback(
    (sql: string, databaseType: DatabaseType) => {
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

  const handleNewDiagramClick = React.useCallback(() => {
    if (sqlChangeDebounceRef.current) {
      clearTimeout(sqlChangeDebounceRef.current);
      sqlChangeDebounceRef.current = null;
    }
    setSidebarMode("sql-input");
    setSqlInputKey((prev) => prev + 1);
    setIsMenuOpen(false);
    setSelectedFileName("Untitled SQL");
    setDetectedDatabaseType(null);
    setEditMode(false);
    pendingMergeRef.current = null;
    resetHistory(null);
    parseMutation.reset();
  }, [parseMutation, resetHistory]);

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

      if (diagram) {
        pendingMergeRef.current = diagram;
      }
      parseMutation.mutate({ sql, databaseType });
    },
    [diagram, parseMutation],
  );

  const handleMergeSQL = React.useCallback(
    (newSql: string, databaseType: DatabaseType) => {
      if (!diagram) return;

      const newDbType =
        databaseType || diagram.databaseType || DatabaseType.GENERIC;

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

          const existingTableKeys = new Set(
            (diagram.tables ?? []).map(tableKey),
          );
          const freshTables = (newDiagram.tables ?? []).filter(
            (t) => !existingTableKeys.has(tableKey(t)),
          );

          if (freshTables.length === 0) {
            showToast("All tables already exist in the diagram", "info");
            return;
          }

          let maxX = 0;
          for (const t of diagram.tables ?? []) {
            if (t.x + 300 > maxX) maxX = t.x + 300;
          }
          freshTables.forEach((t, i) => {
            t.x = maxX + 100;
            t.y = 100 + i * 350;
          });

          const existingRelKeys = new Set(
            (diagram.relationships ?? []).map((r) => normalizeName(r.name)),
          );
          const newRelationships = (newDiagram.relationships ?? []).filter(
            (r) => !existingRelKeys.has(normalizeName(r.name)),
          );

          const merged: Diagram = {
            ...diagram,
            tables: [...(diagram.tables ?? []), ...freshTables],
            relationships: [
              ...(diagram.relationships ?? []),
              ...newRelationships,
            ],
          };

          pushSnapshot(merged);
          setSidebarMode("main");
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
    [diagram, showToast, pushSnapshot],
  );

  // Export SQL
  const handleCopySQL = React.useCallback(async () => {
    if (!diagram) return;
    try {
      const sql = generateSQL(diagram);
      await navigator.clipboard.writeText(sql);
      showToast("SQL copied to clipboard", "success");
    } catch {
      showToast("Failed to copy SQL", "error");
    }
  }, [diagram, showToast]);

  const handleDownloadSQL = React.useCallback(() => {
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
  }, [diagram, showToast]);

  // Export PNG/SVG
  const handleExportPng = React.useCallback(async () => {
    if (!diagram) return;
    setIsExporting("png");
    showToast("Exporting PNG...", "info");
    try {
      await downloadPng(diagram.name || "schema");
      showToast("PNG exported", "success");
    } catch {
      showToast("Failed to export PNG", "error");
    } finally {
      setIsExporting(null);
    }
  }, [diagram, showToast]);

  const handleExportSvg = React.useCallback(async () => {
    if (!diagram) return;
    setIsExporting("svg");
    showToast("Exporting SVG...", "info");
    try {
      await downloadSvg(diagram.name || "schema");
      showToast("SVG exported", "success");
    } catch {
      showToast("Failed to export SVG", "error");
    } finally {
      setIsExporting(null);
    }
  }, [diagram, showToast]);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <header className="w-full px-4 pt-4 relative z-20">
        <div
          className={cn(
            "w-full transition-all duration-300 rounded-2xl border border-white/10",
            "bg-glass shadow-theme-glow",
            isScrolled && "shadow-lg",
          )}
        >
          <div className="px-6 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 max-w-7xl w-full mx-auto">
            <div className="flex h-16 items-center justify-between gap-4">
              {/* Logo + breadcrumb */}
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
                    <FileText className="size-3.5 text-t-400 shrink-0" />
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
              <div className="hidden md:flex items-center space-x-2">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10 transition text-slate-100 text-sm"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>

                {/* Undo / Redo */}
                {diagram && (
                  <>
                    <Button
                      onClick={undo}
                      disabled={!canUndo}
                      size="icon"
                      className="size-9 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo2 className="size-4" />
                    </Button>
                    <Button
                      onClick={redo}
                      disabled={!canRedo}
                      size="icon"
                      className="size-9 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Redo (Ctrl+Shift+Z)"
                    >
                      <Redo2 className="size-4" />
                    </Button>
                  </>
                )}

                {/* Export actions */}
                {diagram && (
                  <>
                    <Button
                      onClick={handleCopySQL}
                      size="icon"
                      className="size-9 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      title="Copy SQL"
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      onClick={handleDownloadSQL}
                      size="icon"
                      className="size-9 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      title="Download .sql"
                    >
                      <Download className="size-4" />
                    </Button>
                    <Button
                      onClick={handleExportPng}
                      disabled={isExporting !== null}
                      size="icon"
                      className="size-9 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      title="Export PNG"
                    >
                      <FileImage className="size-4" />
                    </Button>
                    <Button
                      onClick={handleExportSvg}
                      disabled={isExporting !== null}
                      size="icon"
                      className="size-9 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      title="Export SVG"
                    >
                      <ImageIcon className="size-4" />
                    </Button>
                  </>
                )}

                {diagram && sidebarMode === "main" && (
                  <Button
                    onClick={handleEditDiagramClick}
                    className="px-4 py-2 text-sm font-medium bg-t-600 text-white rounded-lg hover:bg-t-700 transition-all shadow-sm hover:shadow-lg border border-t-500/30"
                  >
                    <Pencil className="size-4 mr-2" />
                    Edit Diagram
                  </Button>
                )}

                <Button
                  onClick={handleNewDiagramClick}
                  className="px-4 py-2 text-sm font-medium bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all shadow-sm border border-white/10"
                >
                  <Plus className="size-4 mr-2" />
                  New Diagram
                </Button>

                <ThemeSelector />

                <SignedIn>
                  <UserButton afterSignOutUrl="/app" />
                </SignedIn>
              </div>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="md:hidden p-2 text-slate-300 hover:bg-white/10 rounded-md transition-colors"
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
                isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
              )}
            >
              <div className="py-4 border-t border-white/10">
                <div className="flex flex-col space-y-2">
                  {diagram && sidebarMode === "main" && (
                    <Button
                      onClick={handleEditDiagramClick}
                      className="w-full px-3 py-2.5 text-sm font-medium bg-white/5 text-white rounded-md hover:bg-white/10 transition-colors border border-white/10"
                    >
                      <Pencil className="size-4 mr-2" />
                      Edit Diagram
                    </Button>
                  )}
                  <Button
                    onClick={handleNewDiagramClick}
                    className="w-full px-3 py-2.5 text-sm font-medium bg-white/5 text-white rounded-md hover:bg-white/10 transition-colors border border-white/10"
                  >
                    <Plus className="size-4 mr-2" />
                    New Diagram
                  </Button>
                  {diagram && (
                    <div className="flex gap-2">
                      <Button
                        onClick={undo}
                        disabled={!canUndo}
                        size="icon"
                        className="size-9 shrink-0 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-30"
                      >
                        <Undo2 className="size-4" />
                      </Button>
                      <Button
                        onClick={redo}
                        disabled={!canRedo}
                        size="icon"
                        className="size-9 shrink-0 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-30"
                      >
                        <Redo2 className="size-4" />
                      </Button>
                      <Button
                        onClick={handleExportPng}
                        disabled={isExporting !== null}
                        size="icon"
                        className="size-9 shrink-0 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        <FileImage className="size-4" />
                      </Button>
                      <Button
                        onClick={handleExportSvg}
                        disabled={isExporting !== null}
                        size="icon"
                        className="size-9 shrink-0 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        <ImageIcon className="size-4" />
                      </Button>
                    </div>
                  )}
                  <ThemeSelector />
                  {parseMutation.isPending && (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300">
                      <Loader2 className="size-4 animate-spin text-t-400" />
                      Parsing...
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

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
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
          <div className="h-full w-full rounded-2xl border border-white/10 bg-surface-1">
            <ReactFlowProvider>
              {parseMutation.isPending ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-400 mx-auto mb-4" />
                    <p className="text-zinc-300">Parsing SQL...</p>
                  </div>
                </div>
              ) : parseMutation.error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <div className="text-red-400 text-5xl mb-4">!</div>
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
                <ChartCanvas diagram={diagram} readOnly={false} />
              )}
            </ReactFlowProvider>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full px-4 pb-3 pt-1 text-center">
        <p className="text-xs text-zinc-500">
          Designed and Developed by{" "}
          <a
            href="https://www.libreonix.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-t-400 hover:text-t-300 transition-colors"
          >
            LIBREONIX PRIVATE LIMITED
          </a>{" "}
          &{" "}
          <a
            href="https://www.akshatkotpalliwar.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-t-400 hover:text-t-300 transition-colors"
          >
            Akshat Kotpalliwar
          </a>
        </p>
      </footer>
    </div>
  );
}
