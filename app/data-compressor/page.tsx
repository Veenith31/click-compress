import { SeoLandingPageView } from "@/components/seo-landing-page";
import { getSeoLandingPage } from "@/lib/seo-landing-pages";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { notFound } from "next/navigation";

const page = getSeoLandingPage("data-compressor");

if (!page) {
  throw new Error("Missing data compressor landing page config");
}

export const metadata = buildPageMetadata({
  title: page.title,
  description: page.description,
  path: page.path,
  keywords: page.keywords,
});

export default function DataCompressorPage() {
  if (!page) notFound();
  return <SeoLandingPageView page={page} />;
}
