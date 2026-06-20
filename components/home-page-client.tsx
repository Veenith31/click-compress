"use client";

import Link from "next/link";
import {
  AskClickHeroButton,
  AskClickRoot,
} from "@/components/ask-click-assistant";
import { CompressionFlowStrip } from "@/components/compression-flow-strip";
import { CompressionHeroAnimation } from "@/components/compression-hero-animation";
import { PageShell } from "@/components/page-shell";
import { CAPABILITIES, SITE, STATS } from "@/lib/site-content";
import { SEO_LANDING_LINKS } from "@/lib/seo-landing-pages";

const CAPABILITY_LINKS: Record<string, string> = {
  Video: "/video-compressor",
  PDF: "/pdf-compressor",
  Documents: "/doc-compressor",
  "Text & data": "/data-compressor",
};

export function HomePageClient() {
  return (
    <AskClickRoot>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black" />
        <div className="absolute top-20 left-1/4 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-10 right-1/4 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl animate-pulse-slow" />

        <PageShell className="relative py-10 sm:py-16 lg:pb-10">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-cyan-400 tracking-wide uppercase animate-float">
                Intelligent compression platform
              </p>
              <h1 className="mt-3 sm:mt-4 max-w-xl text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Shrink files smarter.
                <span className="block text-gray-500 mt-2 text-xl sm:text-4xl lg:text-5xl">
                  Not just smaller — optimized.
                </span>
              </h1>
              <p className="mt-4 sm:mt-6 max-w-xl text-base sm:text-lg text-gray-400">
                {SITE.name} is a free online file compressor for PDF, video,
                documents, and data — routes each upload to the right path
                automatically. Watch how your file flows through the pipeline
                below.
              </p>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <Link
                  href="/compress"
                  className="w-full sm:w-auto text-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-black hover:bg-gray-200 transition-colors"
                >
                  Compress a file
                </Link>
                <AskClickHeroButton />
                <Link
                  href="/how-it-works"
                  className="w-full sm:w-auto text-center rounded-xl border border-white/20 px-6 py-3 text-base font-semibold text-white hover:bg-white/5 transition-colors"
                >
                  How it works
                </Link>
              </div>
            </div>

            <CompressionHeroAnimation />
          </div>
        </PageShell>
      </section>

      <section className="border-b border-white/10 bg-zinc-950/30 -mt-2">
        <PageShell className="py-10 sm:py-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">
              How compression works
            </h2>
            <p className="mt-2 text-gray-400 max-w-lg mx-auto">
              Upload → analyze → compress → download. Each step runs locally
              with format-specific processing.
            </p>
          </div>
          <CompressionFlowStrip />
        </PageShell>
      </section>

      <PageShell>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 text-center hover:border-cyan-500/30 transition-colors"
            >
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </PageShell>

      <section className="border-y border-white/10 bg-gradient-to-b from-zinc-950/80 to-black">
        <PageShell className="py-14 sm:py-16">
          <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-zinc-900/40 p-8 sm:p-10">
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="relative grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                  New · Interactive help
                </p>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold">
                  Ask Click your questions
                </h2>
                <p className="mt-3 text-gray-400 leading-relaxed">
                  Not sure which mode to use? Wondering if we support your file
                  type? Chat with Click — type or talk. Get clear answers about
                  compression, privacy, and getting started. No tech jargon.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-gray-500">
                  <li>· How to compress step by step</li>
                  <li>· Best mode for PDF, video, and images</li>
                  <li>· Optional voice input & spoken replies</li>
                </ul>
              </div>
              <div className="flex flex-col items-start lg:items-end gap-4">
                <AskClickHeroButton />
                <p className="text-xs text-gray-600 max-w-xs lg:text-right">
                  Available on every visit via the floating Ask Click button
                  bottom-right.
                </p>
              </div>
            </div>
          </div>
        </PageShell>
      </section>

      <PageShell>
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">Popular free compressors</h2>
          <p className="mt-2 text-gray-400 max-w-xl">
            Dedicated tools for the file types people search for most.
          </p>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SEO_LANDING_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-cyan-900/40 bg-cyan-950/20 p-5 hover:border-cyan-500/40 transition-colors"
              >
                <p className="font-semibold text-white">{link.label}</p>
                <p className="mt-1 text-xs text-cyan-400/90">Free online →</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">What we compress</h2>
            <p className="mt-2 text-gray-400 max-w-xl">
              One platform, specialized pipelines per format — pick the right
              mode and we handle the rest.
            </p>
          </div>
          <Link
            href="/capabilities"
            className="text-sm text-cyan-400 hover:text-cyan-300 shrink-0"
          >
            View all capabilities →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAPABILITIES.slice(0, 6).map((cap) => {
            const href = CAPABILITY_LINKS[cap.title];
            const inner = (
              <>
                <h3 className="text-lg font-semibold">{cap.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{cap.formats}</p>
                <p className="mt-3 text-sm text-gray-400 line-clamp-2">
                  {cap.description}
                </p>
                <p className="mt-4 text-xs text-emerald-400/90">
                  Typical savings: {cap.savings}
                </p>
                {href && (
                  <p className="mt-3 text-xs text-cyan-400/90">Learn more →</p>
                )}
              </>
            );

            if (!href) {
              return (
                <article
                  key={cap.title}
                  className="rounded-2xl border border-white/10 bg-zinc-900/30 p-6 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300"
                >
                  {inner}
                </article>
              );
            }

            return (
              <Link
                key={cap.title}
                href={href}
                className="rounded-2xl border border-white/10 bg-zinc-900/30 p-6 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 block"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </PageShell>

      <section className="border-t border-white/10 bg-zinc-950/50">
        <PageShell className="py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Ready to reduce your file size?
          </h2>
          <p className="mt-3 text-gray-400 max-w-lg mx-auto">
            Open the workbench, upload any supported file, and download an
            optimized version in minutes. Not sure where to start? Ask Click.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/compress"
              className="rounded-xl bg-white px-8 py-3 font-semibold text-black hover:bg-gray-200 transition-colors"
            >
              Open compression workbench
            </Link>
            <AskClickHeroButton />
          </div>
        </PageShell>
      </section>
    </AskClickRoot>
  );
}
