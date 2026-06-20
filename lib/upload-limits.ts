/** Vercel Hobby serverless request body limit (~4.5 MB); keep headroom. */
export const CLOUD_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function isProductionHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host !== "localhost" && host !== "127.0.0.1";
}
