'use client';
/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */

    import * as React from 'react';
    import { ChartCanvas } from './chart-canvas';
    import { Button } from './ui/button';
    import { useParseSQLContext } from '@/context/parse-sql-context';
    import { cn } from '@/lib/utils';
    import Image from 'next/image';
    import { Upload, FileText, Loader2, Menu, X, ExternalLink, Github, Share2, MessageCircle, Plus } from 'lucide-react';
    import { ReactFlowProvider } from '@xyflow/react';
    import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';
import { SqlFilesSidebar } from './sql-files-sidebar';
// import { Sidebar } from './ui/sidebar'; // Deprecated: Replaced by header "New Diagram" button
import { SqlInputSidebar } from './sql-input-sidebar';
import { useQueryClient } from '@tanstack/react-query';
import { PresenceAvatars, ConnectionStatus } from './presence-avatars';
import { ShareDialog } from './share-dialog';
// Comments feature disabled
// import { CommentsPanel } from './comments/comments-panel';
import { RightSidebar } from './right-sidebar';
import { useOptionalCollaboration } from '@/context/collaboration-context';
// import type { CommentData } from '@/lib/collaboration/types';
import { detectDatabaseType } from '@/lib/parsers';
import { DatabaseType } from '@/lib/domain/database-type';
import { useToast } from './toast';

    interface VisualizerLayoutProps {
    className?: string;
    }

    // Helper function to format database type for display
    function formatDatabaseTypeForDisplay(dbType: DatabaseType | null | undefined): string | null {
        if (!dbType) return null;
        
        // Map DatabaseType enum to readable display names
        const typeMap: Record<DatabaseType, string> = {
            [DatabaseType.GENERIC]: 'Generic',
            [DatabaseType.POSTGRESQL]: 'PostgreSQL',
            [DatabaseType.MYSQL]: 'MySQL',
            [DatabaseType.MARIADB]: 'MariaDB',
            [DatabaseType.SQL_SERVER]: 'SQL Server',
            [DatabaseType.SQLITE]: 'SQLite',
            [DatabaseType.ORACLE]: 'Oracle',
        };
        
        return typeMap[dbType] || null;
    }

    export function VisualizerLayout({ className }: VisualizerLayoutProps) {
    const { parseMutation } = useParseSQLContext();
    const diagram = parseMutation.data?.diagram ?? null;
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);
    const [detectedDatabaseType, setDetectedDatabaseType] = React.useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false);
    const [isCommentsPanelOpen, setIsCommentsPanelOpen] = React.useState(false);
    const [navigateToCommentId, setNavigateToCommentId] = React.useState<number | null>(null);
    const [sidebarMode, setSidebarMode] = React.useState<'main' | 'sql-input'>('main');
    const queryClient = useQueryClient();
    const collaboration = useOptionalCollaboration();
    const { showToast } = useToast();

    // Shared function to handle SQL content loading (from file upload or sidebar)
    const handleSQLContent = React.useCallback((sqlContent: string, fileName: string) => {
        // Detect database type using chartdb's robust detection engine
        const detectedType = detectDatabaseType(sqlContent);
        const displayType = formatDatabaseTypeForDisplay(detectedType);
        if (!displayType) {
            showToast('Could not detect SQL dialect — defaulting to PostgreSQL. You can change this in the selector.', 'info');
        }
        setDetectedDatabaseType(displayType || 'PostgreSQL');
        setSelectedFileName(fileName);
        
        // Parse the SQL
        parseMutation.mutate({ sql: sqlContent });
    }, [parseMutation, showToast]);

    // Handle SQL changes from the SQL input sidebar
    const handleSqlInputChange = React.useCallback((sql: string, databaseType: DatabaseType) => {
        // Update the parse mutation with both sql and databaseType
        parseMutation.mutate({ sql, databaseType });
    }, [parseMutation]);

    // Clear file info when parsing starts (to show loading state)
    React.useEffect(() => {
        if (parseMutation.isPending) {
            // Keep the filename and database type during parsing
        }
    }, [parseMutation.isPending]);
    
    // Placeholder diagram ID - in production, this would come from route params or saved state
    const currentDiagramId = React.useMemo(() => {
      // For now, use a static ID or generate one when diagram is loaded
      return diagram?.id ?? 'temp-diagram';
    }, [diagram?.id]);

    // Initialize collaboration context with diagram ID
    // Use ref to track previous diagram ID to prevent unnecessary updates
    const prevDiagramIdRef = React.useRef<string | null>(null);
    React.useEffect(() => {
      if (!collaboration?.setDiagramId) return;
      
      const diagramId = diagram?.id ?? null;
      
      // Clear collaboration context when diagram ID changes (before setting new one)
      if (prevDiagramIdRef.current !== null && prevDiagramIdRef.current !== diagramId) {
        // Clear the old diagram's collaboration state
        collaboration.setDiagramId(null);
        // Invalidate queries for the old diagram
        queryClient.removeQueries({ queryKey: ['diagram-comments', prevDiagramIdRef.current] });
      }
      
      // Only update if diagram ID actually changed
      if (prevDiagramIdRef.current !== diagramId) {
        prevDiagramIdRef.current = diagramId;
        // Set new diagram ID (this will trigger comments refetch)
        if (diagramId) {
          collaboration.setDiagramId(diagramId);
        }
      }
      
      return () => {
        // Only clear on unmount, not on every change
        if (prevDiagramIdRef.current !== null) {
          const oldId = prevDiagramIdRef.current;
          prevDiagramIdRef.current = null;
          collaboration.setDiagramId(null);
          queryClient.removeQueries({ queryKey: ['diagram-comments', oldId] });
        }
      };
    }, [diagram?.id, collaboration?.setDiagramId, queryClient]);

    // Comments feature disabled
    // // Navigate to comment location on canvas
    // const handleNavigateToComment = React.useCallback((comment: CommentData) => {
    //   // Close panel
    //   setIsCommentsPanelOpen(false);
    //   // Set comment ID to navigate to - ChartCanvas will handle the navigation
    //   setNavigateToCommentId(comment.id);
    //   // Clear after a short delay to allow re-navigation if needed
    //   setTimeout(() => setNavigateToCommentId(null), 100);
    // }, []);

    const navLinks = React.useMemo(
        () => [
        { href: '', text: '' },
        ],
        []
    );

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    React.useEffect(() => {
        const handleResize = () => {
        if (window.innerWidth >= 768) setIsMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleFileSelect = React.useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            
            // Save to database
            try {
                await fetch('/api/sql-files', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: file.name,
                        content: text,
                    }),
                });
                // Invalidate query cache to refresh sidebar
                queryClient.invalidateQueries({ queryKey: ['sql-files'] });
            } catch (dbError) {
                console.error('Error saving file to database:', dbError);
                // Continue even if saving fails
            }
            
            // Use shared handler
            handleSQLContent(text, file.name);
        } catch (error) {
            console.error('Error reading file:', error);
            setSelectedFileName(null);
            setDetectedDatabaseType(null);
        } finally {
            // Reset file input so the same file can be re-uploaded
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
        },
        [handleSQLContent, queryClient]
    );

    const handleUploadClick = React.useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div
        className={cn(
            'flex h-screen w-screen flex-col bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden',
            className
        )}
        >
        <header className="w-full px-4 pt-4">
            <div className={cn(
                'w-full transition-all duration-300 rounded-2xl border border-white/10',
                'bg-white/5 backdrop-blur-2xl shadow-[0_20px_70px_-30px_rgba(59,130,246,0.45)]',
                isScrolled && 'shadow-lg'
            )}>
            <div className="px-6 sm:px-8 lg:px-10 xl:px-12 2xl:px-16 max-w-7xl w-full mx-auto">
            <div className="flex h-16 sm:h-18 lg:h-20 items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Image
                    src="/logo.png"
                    alt="SchemaVis logo"
                    width={80}
                    height={80}
                    className="h-20 w-20 object-contain scale-150"
                    priority
                    />
                </div>

                <div className="hidden md:flex items-center gap-2 text-xs text-slate-300">
                <SignedOut>
                    <SignInButton mode="modal">
                    <button className="ml-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10 transition text-slate-100">
                        <span>Sign in</span>
                    </button>
                    </SignInButton>
                </SignedOut>
                {/* <a
                    href="https://github.com/IntegerAlex/SchemaVis"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 hover:bg-white/10 transition text-slate-100"
                >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                </a> */}
                </div>

                <div className="hidden md:flex items-center space-x-3">
                {/* Collaboration features disabled */}

                {/* Comment and share buttons moved to right sidebar */}

                <Button
                    onClick={() => setSidebarMode('sql-input')}
                    className="px-5 py-2 text-sm font-medium bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-sm hover:shadow-lg transform hover:scale-105 border border-white/10"
                >
                    <Plus className="size-4 mr-2" />
                    New Diagram
                </Button>

                <Button
                    onClick={handleUploadClick}
                    disabled={parseMutation.isPending}
                    className="px-5 py-2 text-sm font-medium bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-sm hover:shadow-lg transform hover:scale-105 border border-white/10"
                >
                    {parseMutation.isPending ? (
                    <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Parsing...
                    </>
                    ) : (
                    <>
                        <Upload className="size-4 mr-2" />
                        Upload SQL
                    </>
                    )}
                </Button>
                {selectedFileName && !parseMutation.isPending && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 max-w-[300px]">
                    <FileText className="size-4 text-blue-400 shrink-0" />
                    <span className="text-sm text-zinc-300 truncate">{selectedFileName}</span>
                    {(detectedDatabaseType || formatDatabaseTypeForDisplay(diagram?.databaseType)) && (
                        <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-xs text-zinc-400 font-medium shrink-0">
                                {detectedDatabaseType || formatDatabaseTypeForDisplay(diagram?.databaseType)}
                            </span>
                        </>
                    )}
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sql"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <SignedIn>
                    <UserButton afterSignOutUrl="/app" />
                </SignedIn>
                </div>

                <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                aria-label="Toggle menu"
                >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            <div
                className={cn(
                'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
                isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                )}
            >
                <div className="py-4 border-t border-gray-200/70 dark:border-gray-800/70">
                <div className="flex flex-col space-y-1">
                    {navLinks.map((link) => (
                    <a
                        key={link.text}
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        {link.text}
                    </a>
                    ))}
                    <div className="pt-4 mt-2 border-t border-gray-200/70 dark:border-gray-700/70 flex flex-col space-y-2">
                    <a
                        href="#"
                        className="flex items-center justify-center space-x-2 px-3 py-2.5 text-sm font-medium border border-gray-300/70 dark:border-gray-700/70 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <span>Resume</span>
                        <ExternalLink className="h-4 w-4" />
                    </a>
                    <Button
                        onClick={() => setSidebarMode('sql-input')}
                        className="w-full px-3 py-2.5 text-sm font-medium bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors border border-white/10"
                    >
                        <Plus className="size-4 mr-2" />
                        New Diagram
                    </Button>
                    <Button
                        onClick={handleUploadClick}
                        disabled={parseMutation.isPending}
                        className="w-full px-3 py-2.5 text-sm font-medium bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors border border-white/10"
                    >
                        {parseMutation.isPending ? (
                        <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Parsing...
                        </>
                        ) : (
                        <>
                            <Upload className="size-4 mr-2" />
                            Upload SQL
                        </>
                        )}
                    </Button>
                    {selectedFileName && !parseMutation.isPending && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                        <FileText className="size-4 text-blue-400 shrink-0" />
                        <span className="text-sm text-zinc-300 truncate">{selectedFileName}</span>
                        {(detectedDatabaseType || formatDatabaseTypeForDisplay(diagram?.databaseType)) && (
                            <>
                                <span className="text-zinc-600">•</span>
                                <span className="text-xs text-zinc-400 font-medium shrink-0">
                                    {detectedDatabaseType || formatDatabaseTypeForDisplay(diagram?.databaseType)}
                                </span>
                            </>
                        )}
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".sql"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
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
            </div>
        </header>

        {/* Main Content Area with Sidebar */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Sidebar - Deprecated: Replaced by header "New Diagram" button */}
          {/* <Sidebar onNewDiagramClick={() => setSidebarMode('sql-input')} /> */}

          {/* SQL Files Sidebar or SQL Input Sidebar */}
          <SignedIn>
            {sidebarMode === 'main' ? (
              <SqlFilesSidebar onFileLoad={handleSQLContent} />
            ) : (
              <SqlInputSidebar
                onBackClick={() => setSidebarMode('main')}
                onSqlChange={handleSqlInputChange}
                isLoading={parseMutation.isPending}
                error={parseMutation.error?.error}
              />
            )}
          </SignedIn>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden bg-slate-900/40 backdrop-blur-xl px-4 pb-6 pt-4 relative">
            <div className="h-full w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_70px_-30px_rgba(59,130,246,0.45)]">
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
                    <h3 className="text-xl font-semibold text-white mb-2">Error Parsing SQL</h3>
                    <p className="text-zinc-300 mb-4">
                    {parseMutation.error.error || 'Failed to parse SQL file'}
                    </p>
                    <Button
                    onClick={handleUploadClick}
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

          {/* Right Sidebar - Comments feature disabled */}
          <SignedIn>
            {diagram && (
              <RightSidebar
                // Comments feature disabled
                // onCommentsClick={() => setIsCommentsPanelOpen((prev) => !prev)}
                onCommentsClick={() => {}} // Disabled
                onShareClick={() => setIsShareDialogOpen(true)}
                isCommentsOpen={false} // Disabled
                showShare={!!diagram}
              />
            )}
          </SignedIn>
        </div>

        {/* Share Dialog */}
        <ShareDialog
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
        />

        {/* Comments feature disabled */}
        {/* Comments Panel */}
        {/* <CommentsPanel
          isOpen={isCommentsPanelOpen}
          onClose={() => setIsCommentsPanelOpen(false)}
          onNavigateToComment={handleNavigateToComment}
        /> */}
        </div>
    );
    }

