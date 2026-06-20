import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Downloads",
  description: "Download project overview slides for Click-Compress.",
};

const FILES = [
  {
    name: "Click-Compress-Project-Slides.pptx",
    label: "PowerPoint (.pptx)",
    description:
      "24-slide project overview: internship section and Click-Compress platform walkthrough",
  },
  {
    name: "Click-Compress-Project-Slides.docx",
    label: "Word (.docx)",
    description: "Same overview in Word format with embedded screenshots",
  },
];

export default function DownloadsPage() {
  return (
    <PageShell narrow>
      <h1 className="text-3xl font-extrabold tracking-tight">Downloads</h1>
      <p className="mt-4 text-gray-400">
        Project overview slides in simple, editable Office formats.
      </p>

      <ul className="mt-10 space-y-4">
        {FILES.map((file) => (
          <li
            key={file.name}
            className="rounded-xl border border-white/10 bg-zinc-900/40 p-6"
          >
            <p className="font-semibold text-white">{file.label}</p>
            <p className="mt-1 text-sm text-gray-500">{file.description}</p>
            <a
              href={`/downloads/${file.name}`}
              download
              className="inline-block mt-4 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-200"
            >
              Download {file.name}
            </a>
          </li>
        ))}
      </ul>

      <Link
        href="/about"
        className="inline-block mt-10 text-sm text-cyan-400 hover:text-cyan-300"
      >
        ← Back to About
      </Link>
    </PageShell>
  );
}
