import type { Metadata } from "next";
import { CompressWorkbench } from "@/components/compress-workbench";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Compress Files Online — PDF, Video, Audio & Documents",
  description:
    "Upload and compress PDF, MP4, MOV, WAV, DOCX, CSV, and JSON online for free. Real-time progress and instant download.",
  path: "/compress",
  keywords: [
    "compress files online",
    "online file compressor",
    "compress pdf video audio",
  ],
});

export default function CompressPage() {
  return <CompressWorkbench />;
}

