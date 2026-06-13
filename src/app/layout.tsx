import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { GlobalStructuredData } from "@/components/structured-data";
import { ToastProvider } from "@/components/toast";
// Collaboration features temporarily disabled
// import { CollaborationProvider } from "@/context/collaboration-context";
import { DiagramEventsProvider } from "@/context/diagram-events-context";
import { ThemeProvider } from "@/context/theme-context";
import { QueryProvider } from "@/providers/query-provider";

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
  description:
    "SchemaVis is a free, open-source (AGPLv3) database schema visualizer. Generate interactive ER diagrams from SQL instantly. Collaborate, document, and explore PostgreSQL, MySQL, and more.",
  metadataBase: new URL("https://schemavis.gossorg.in"),
  keywords: [
    "database visualization",
    "schema visualizer",
    "sql diagram",
    "ERD tool",
    "PostgreSQL ERD",
    "MySQL schema",
    "database design",
    "open source ERD",
    "AGPLv3 database tool",
    "SQL to ERD",
    "database documentation",
    "SchemaVis",
    "free schema tool",
  ],
  authors: [
    { name: "Akshat Kotpalliwar", url: "https://github.com/IntegerAlex" },
  ],
  creator: "Akshat Kotpalliwar",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://schemavis.gossorg.in",
    title: "SchemaVis - Open Source Database Schema Visualizer",
    description:
      "Instantly visualize and document your database schemas from SQL files. Fast, free, collaborative, and open-source under AGPLv3.",
    siteName: "SchemaVis",
    images: [
      {
        url: "/landing.png",
        width: 1200,
        height: 630,
        alt: "SchemaVis - Database Schema Visualizer Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SchemaVis - Free Database Schema Visualizer",
    description:
      "Generate interactive ER diagrams from SQL instantly. Free, fast, and open-source.",
    images: ["/landing.png"],
    creator: "@IntegerAlex",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: {
      url: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
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
      <head>
        <GlobalStructuredData />
      </head>
      <ClerkProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <QueryProvider>
            <ThemeProvider>
              <ToastProvider>
                <DiagramEventsProvider>{children}</DiagramEventsProvider>
              </ToastProvider>
            </ThemeProvider>
          </QueryProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}
