import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { CAPABILITIES, MODES } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Capabilities | Click-Compress",
  description:
    "Supported file types, compression methods, and expected savings.",
};

export default function CapabilitiesPage() {
  return (
    <PageShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Capabilities
        </h1>
        <p className="mt-4 text-gray-400 text-lg">
          Every file type gets its own pipeline. We pick the right approach for
          your content — not a one-size-fits-all zip.
        </p>
      </div>

      <div className="mt-14 grid gap-6">
        {CAPABILITIES.map((cap) => (
          <article
            key={cap.title}
            className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{cap.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{cap.formats}</p>
              </div>
              <span className="shrink-0 inline-flex rounded-full bg-emerald-950 border border-emerald-800/50 px-3 py-1 text-sm text-emerald-400">
                {cap.savings} typical
              </span>
            </div>
            <p className="mt-4 text-gray-400">{cap.description}</p>
            <p className="mt-3 text-sm text-gray-500">
              <span className="text-gray-400 font-medium">Approach:</span>{" "}
              {cap.method}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold">Compression modes</h2>
        <p className="mt-2 text-gray-400">
          Choose how aggressive the platform should be for your use case.
        </p>
        <div className="mt-8 grid sm:grid-cols-3 gap-5">
          {MODES.map((mode) => (
            <div
              key={mode.id}
              className="rounded-2xl border border-white/10 bg-black/40 p-6"
            >
              <h3 className="font-semibold">{mode.name}</h3>
              <p className="mt-2 text-sm text-gray-400">{mode.summary}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 rounded-2xl border border-cyan-900/40 bg-cyan-950/20 p-8 text-center">
        <p className="text-gray-300">
          Already know your file type? Head straight to the workbench.
        </p>
        <Link
          href="/compress"
          className="inline-block mt-6 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-gray-200"
        >
          Start compressing
        </Link>
      </div>
    </PageShell>
  );
}
