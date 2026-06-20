import type { Metadata } from "next";
import { siteUrl } from "@/lib/env";
import { SITE } from "@/lib/site-content";

type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildPageMetadata(input: PageSeoInput): Metadata {
  const url = `${siteUrl()}${input.path}`;
  const title = input.title.includes(SITE.name)
    ? input.title
    : `${input.title} | ${SITE.name}`;

  return {
    title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: input.path,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE.name,
      title,
      description: input.description,
      images: [{ url: SITE.logo, width: 512, height: 512, alt: SITE.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: [SITE.logo],
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}
