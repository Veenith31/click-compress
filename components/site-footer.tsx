import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { NAV_LINKS, SITE } from "@/lib/site-content";
import { SEO_LANDING_LINKS } from "@/lib/seo-landing-pages";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <SiteLogo variant="footer" />
            <p className="mt-3 text-sm text-gray-400 max-w-xs">{SITE.tagline}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Platform
            </p>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Free compressors
            </p>
            <ul className="mt-4 space-y-2">
              {SEO_LANDING_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Built for
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>Creators & marketers</li>
              <li>Students & researchers</li>
              <li>Teams sharing large assets</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 pt-8 border-t border-white/5 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {SITE.name}. Compression runs locally on your device.
        </p>
      </div>
    </footer>
  );
}
