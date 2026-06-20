import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

const PUBLIC_PATHS = [
  "",
  "/capabilities",
  "/compress",
  "/how-it-works",
  "/about",
  "/downloads",
  "/login",
  "/signup",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/compress" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/compress" ? 0.9 : 0.7,
  }));
}
