import Link from "next/link";
import { FaqPageJsonLd } from "@/components/structured-data";
import { PageShell } from "@/components/page-shell";
import {
  getSeoLandingPage,
  SEO_LANDING_PAGES,
  type SeoLandingPage,
} from "@/lib/seo-landing-pages";

type SeoLandingPageViewProps = {
  page: SeoLandingPage;
};

export function SeoLandingPageView({ page }: SeoLandingPageViewProps) {
  const related = page.relatedSlugs
    .map((slug) => getSeoLandingPage(slug))
    .filter((item): item is SeoLandingPage => Boolean(item));

  return (
    <>
      <FaqPageJsonLd faqs={page.faqs} />
      <PageShell>
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Free online tool
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {page.h1}
          </h1>
          <p className="mt-4 text-lg text-gray-300">{page.subhead}</p>
          {page.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mt-4 text-gray-400 leading-relaxed">
              {paragraph}
            </p>
          ))}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/compress"
              className="inline-flex justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-gray-200 transition-colors"
            >
              Compress now — free
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Supported formats
            </p>
            <p className="mt-2 text-gray-200">{page.formats}</p>
          </div>
          <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500/80">
              Typical savings
            </p>
            <p className="mt-2 text-emerald-300 font-semibold">{page.savings}</p>
          </div>
        </div>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">Why use Click-Compress?</h2>
          <ul className="mt-6 space-y-3">
            {page.features.map((feature) => (
              <li
                key={feature}
                className="flex gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300"
              >
                <span className="text-cyan-400 shrink-0" aria-hidden>
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">How to compress in 3 steps</h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-3">
            {page.steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-white/10 bg-zinc-900/30 p-6"
              >
                <p className="text-xs font-bold text-cyan-400">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-8 space-y-4">
            {page.faqs.map((faq) => (
              <article
                key={faq.question}
                className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6"
              >
                <h3 className="font-semibold text-white">{faq.question}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-bold">Other free compressors</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={item.path}
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-cyan-500/40 hover:text-white transition-colors"
                >
                  {item.primaryKeyword}
                </Link>
              ))}
              <Link
                href="/capabilities"
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-cyan-500/40 hover:text-white transition-colors"
              >
                All capabilities
              </Link>
            </div>
          </section>
        )}

        <div className="mt-14 rounded-2xl border border-cyan-900/40 bg-cyan-950/20 p-8 text-center">
          <h2 className="text-xl font-bold">Ready to compress your file?</h2>
          <p className="mt-2 text-gray-400 max-w-lg mx-auto">
            Open the workbench, upload your file, and download a smaller version in minutes.
          </p>
          <Link
            href="/compress"
            className="inline-block mt-6 rounded-xl bg-white px-8 py-3 text-sm font-semibold text-black hover:bg-gray-200 transition-colors"
          >
            Start compressing free
          </Link>
        </div>
      </PageShell>
    </>
  );
}

export function allSeoLandingSlugs(): string[] {
  return SEO_LANDING_PAGES.map((page) => page.slug);
}
