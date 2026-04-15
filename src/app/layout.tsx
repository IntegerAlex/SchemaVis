import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ClerkProvider } from "@clerk/nextjs";
// Collaboration features temporarily disabled
// import { CollaborationProvider } from "@/context/collaboration-context";
import { DiagramEventsProvider } from "@/context/diagram-events-context";
import { ToastProvider } from "@/components/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | SchemaVis",
    default: "SchemaVis - Free Open Source Database Schema Visualizer",
  },
  description: "Visualize, explore, and document your database schemas instantly from SQL files. Fast, free, and open-source schema visualization tool for PostgreSQL, MySQL, SQL Server, and more.",
  metadataBase: new URL("https://schemavis.gossorg.in"),
  keywords: ["database visualization", "schema visualizer", "sql diagram", "ERD tool", "PostgreSQL", "MySQL", "database schema design", "open source ERD"],
  authors: [{ name: "Akshat Kotpalliwar" }],
  creator: "Akshat Kotpalliwar",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://schemavis.gossorg.in",
    title: "SchemaVis - Free Open Source Database Schema Visualizer",
    description: "Visualize, explore, and document your database schemas instantly from SQL files. Fast, free, and open-source.",
    siteName: "SchemaVis",
    images: [{
      url: "/landing.png",
      width: 1200,
      height: 630,
      alt: "SchemaVis - Database Schema Visualizer Interface"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SchemaVis - Free Open Source Database Schema Visualizer",
    description: "Visualize, explore, and document your database schemas instantly from SQL files. Fast, free, and open-source.",
    images: ["/landing.png"],
    creator: "@IntegerAlex",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <QueryProvider>
            <ToastProvider>
              <DiagramEventsProvider>
                {/* Collaboration features temporarily disabled */}
                {/* <CollaborationProvider>{children}</CollaborationProvider> */}
                {children}
              </DiagramEventsProvider>
            </ToastProvider>
          </QueryProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}
