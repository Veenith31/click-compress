import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/components/auth-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/auth-server";
import {
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  WebSiteJsonLd,
} from "@/components/structured-data";
import { siteUrl } from "@/lib/env";
import { SITE } from "@/lib/site-content";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE.name} | Free PDF, Video & Data Compressor Online`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Free online file compressor for PDF, video, documents, and data. Compress MP4, PDF, DOCX, CSV, and JSON — target 40%+ savings with smart format-aware compression.",
  keywords: [
    "file compressor",
    "pdf compressor",
    "video compressor",
    "doc compressor",
    "data compressor",
    "compress pdf online free",
    "compress video online",
    "compress csv json",
    "free file compression",
    "Click-Compress",
  ],
  icons: {
    icon: [
      { url: "/logo-icon.png", type: "image/png" },
      { url: "/logo-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/logo-icon-512.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/logo-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl(),
    siteName: SITE.name,
    title: `${SITE.name} | Free PDF, Video & Data Compressor`,
    description: SITE.description,
    images: [{ url: SITE.logo, width: 512, height: 512, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | Free PDF, Video & Data Compressor`,
    description: SITE.description,
    images: [SITE.logo],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "0GinUmkY9h-L0URSgamQNw063LRbayxayMej9TEM3iQ",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white font-sans">
        <WebSiteJsonLd />
        <OrganizationJsonLd />
        <SoftwareApplicationJsonLd />
        <AuthProvider initialUser={user}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
