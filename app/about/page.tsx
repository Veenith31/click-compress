import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SITE } from "@/lib/site-content";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Click-Compress — Free Online File Compressor",
  description:
    "Click-Compress is a free online file compressor for PDF, video, Office documents, and structured data — privacy-first and format-aware.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <PageShell narrow>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
        About {SITE.name}
      </h1>
      <p className="mt-4 text-gray-400 text-lg leading-relaxed">
        {SITE.name} is a format-aware compression platform built for people who
        need real size reduction — not just wrapping files in another archive.
      </p>

      <div className="mt-12 space-y-8 text-gray-400 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white">Our approach</h2>
          <p className="mt-3">
            Most tools apply one approach to everything. We detect what your file
            actually is, then route it to a specialized pipeline tuned for video,
            PDF, images, documents, or text.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">Privacy-first</h2>
          <p className="mt-3">
            Browser-based modes process files locally in your session. High-impact
            local mode runs on your own machine — your files are not uploaded to
            external compression services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white">Honest targets</h2>
          <p className="mt-3">
            We target around 40% savings where the format allows it. Already-compressed
            files (tiny JPEGs, pre-zipped archives) may save less — the platform
            reports actual results and never inflates numbers.
          </p>
        </section>
      </div>

      <div className="mt-14 flex flex-wrap gap-4">
        <Link
          href="/compress"
          className="rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200"
        >
          Open workbench
        </Link>
        <Link
          href="/capabilities"
          className="rounded-xl border border-white/20 px-6 py-3 font-semibold hover:bg-white/5"
        >
          View capabilities
        </Link>
        <Link
          href="/downloads"
          className="rounded-xl border border-white/20 px-6 py-3 font-semibold hover:bg-white/5"
        >
          Download slides
        </Link>
      </div>
    </PageShell>
  );
}
