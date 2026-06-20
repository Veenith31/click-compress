import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser } from "@/lib/auth-server";
import {
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE.name} | Free Online File Compression — PDF, Video, Images`,
    template: `%s | ${SITE.name}`,
  },
  description:
    "Compress PDF, video, and images online for free. Click-Compress targets 40%+ savings with smart format-aware compression. Secure accounts with encrypted file storage.",
  keywords: [
    "file compression",
    "compress PDF online",
    "compress video online",
    "image compression",
    "lossless compression",
    "free file compressor",
    "Click-Compress",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: SITE.logoIcon,
    apple: SITE.logoIcon,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl(),
    siteName: SITE.name,
    title: `${SITE.name} | Smart Compression Platform`,
    description: SITE.description,
    images: [{ url: SITE.logo, width: 512, height: 512, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | Smart Compression Platform`,
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
        <SoftwareApplicationJsonLd />
        <AuthProvider initialUser={user}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
