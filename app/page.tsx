import { HomePageClient } from "@/components/home-page-client";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  title: "Free Online File Compressor — PDF, Video, Data & Documents",
  description:
    "Compress PDF, MP4, Word, CSV, and JSON files online for free. Click-Compress uses smart format-aware compression to target 40%+ savings — no signup required.",
  path: "/",
  keywords: [
    "file compressor online free",
    "pdf compressor",
    "video compressor",
    "data compressor",
    "doc compressor",
  ],
});

export default function HomePage() {
  return <HomePageClient />;
}

