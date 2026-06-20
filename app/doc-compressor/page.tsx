import { SeoLandingPageView } from "@/components/seo-landing-page";
import { getSeoLandingPage } from "@/lib/seo-landing-pages";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { notFound } from "next/navigation";

const page = getSeoLandingPage("doc-compressor");

if (!page) {
  throw new Error("Missing document compressor landing page config");
}

export const metadata = buildPageMetadata({
  title: page.title,
  description: page.description,
  path: page.path,
  keywords: page.keywords,
});

export default function DocCompressorPage() {
  if (!page) notFound();
  return <SeoLandingPageView page={page} />;
}
