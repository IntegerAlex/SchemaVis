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
    import { Upload, FileText, Loader2, Menu, X, ExternalLink, Github } from 'lucide-react';
    import { ReactFlowProvider } from '@xyflow/react';
    import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';

    interface VisualizerLayoutProps {
    className?: string;
    }

    export function VisualizerLayout({ className }: VisualizerLayoutProps) {
    const { parseMutation } = useParseSQLContext();
    const diagram = parseMutation.data?.diagram ?? null;
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);

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

        setSelectedFileName(file.name);
        
        try {
            const text = await file.text();
            parseMutation.mutate(text);
        } catch (error) {
            console.error('Error reading file:', error);
            setSelectedFileName(null);
        }
        },
        [parseMutation]
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
        <header
            className={cn(
            'w-full transition-all duration-300 border-b',
            isScrolled
                ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl shadow-lg border-white/10'
                : 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-white/5'
            )}
        >
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
                <Button
                    onClick={handleUploadClick}
                    disabled={parseMutation.isPending}
                    className="px-5 py-2 text-sm font-medium bg-gray-900 text-white dark:bg-gray-50 dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-sm hover:shadow-lg transform hover:scale-105 border border-white/10"
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
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10 max-w-[220px]">
                    <FileText className="size-4 text-blue-400" />
                    <span className="text-sm text-zinc-300 truncate">{selectedFileName}</span>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".sql,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <SignedIn>
                    <UserButton afterSignOutUrl="/" />
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
                        <FileText className="size-4 text-blue-400" />
                        <span className="text-sm text-zinc-300 truncate">{selectedFileName}</span>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".sql,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <SignedIn>
                        <div className="flex justify-center pt-2">
                        <UserButton afterSignOutUrl="/" />
                        </div>
                    </SignedIn>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </header>

        {/* Canvas - Full Width */}
        <div className="flex-1 overflow-hidden bg-slate-900/40 backdrop-blur-xl px-4 pb-6 pt-4">
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
                <ChartCanvas diagram={diagram} />
            )}
            </ReactFlowProvider>
            </div>
        </div>
        </div>
    );
    }

