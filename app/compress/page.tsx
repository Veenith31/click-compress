import type { Metadata } from "next";
import { CompressWorkbench } from "@/components/compress-workbench";

export const metadata: Metadata = {
  title: "Compress | Click-Compress",
  description: "Upload and compress video, PDF, images, and documents.",
};

export default function CompressPage() {
  return <CompressWorkbench />;
}
