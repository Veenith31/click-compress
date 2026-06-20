import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { SEO_LANDING_PAGES } from "@/lib/seo-landing-pages";

const PUBLIC_PATHS = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/compress", priority: 0.95, changeFrequency: "weekly" as const },
  ...SEO_LANDING_PAGES.map((page) => ({
    path: page.path,
    priority: 0.9,
    changeFrequency: "weekly" as const,
  })),
  { path: "/capabilities", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/how-it-works", priority: 0.75, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/downloads", priority: 0.4, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  return PUBLIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
