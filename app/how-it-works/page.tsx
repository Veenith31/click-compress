import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { STEPS } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "How it works | Click-Compress",
  description: "Learn how Click-Compress analyzes and optimizes your files.",
};

export default function HowItWorksPage() {
  return (
    <PageShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          How it works
        </h1>
        <p className="mt-4 text-gray-400 text-lg">
          A dispatcher inspects your file, selects the right compression stack,
          and validates output before you download.
        </p>
      </div>

      <ol className="mt-14 space-y-8">
        {STEPS.map((item) => (
          <li
            key={item.step}
            className="flex gap-6 sm:gap-10 rounded-2xl border border-white/10 bg-zinc-900/30 p-6 sm:p-8"
          >
            <span className="text-4xl font-extrabold text-white/10 shrink-0">
              {item.step}
            </span>
            <div>
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="mt-2 text-gray-400">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 grid sm:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 p-6">
          <h3 className="font-semibold text-cyan-400">In-browser processing</h3>
          <p className="mt-2 text-sm text-gray-400">
            Images, text, and lossless archives run in your browser. Nothing is
            sent to a cloud service unless you choose high-impact local mode.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 p-6">
          <h3 className="font-semibold text-purple-400">High-impact local</h3>
          <p className="mt-2 text-sm text-gray-400">
            Video and PDF use the strongest local processing path on your machine
            — maximum compression with compatible video output.
          </p>
        </div>
      </div>

      <p className="mt-12 text-center">
        <Link
          href="/compress"
          className="text-cyan-400 hover:text-cyan-300 font-medium"
        >
          Try it now →
        </Link>
      </p>
    </PageShell>
  );
}
