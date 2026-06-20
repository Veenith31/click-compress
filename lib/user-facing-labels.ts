/** Maps internal compression method ids to user-safe labels (no library names). */
export function userFacingMethod(method: string): string {
  if (method === "video-pass-through") return "Video (already optimized)";
  if (method.startsWith("video")) return "Video compression";
  if (method.startsWith("audio")) return "Audio compression";
  if (method.startsWith("pdf")) return "PDF optimization";
  if (method.startsWith("image")) return "Image optimization";
  if (method.startsWith("office") || method.startsWith("generic")) {
    return "Document compression";
  }
  if (method.startsWith("brotli") || method.startsWith("deflate")) {
    return "Lossless compression";
  }
  if (method === "store-copy") return "Original file";
  if (method === "rle" || method === "lzw-dictionary") return "Lossless compression";
  return "Optimized compression";
}

export function userFacingAiNote(note: string | undefined): string | undefined {
  if (!note) return undefined;
  return note
    .replace(/AI routing \([^)]+\):\s*/i, "Smart routing: ")
    .replace(/openrouter[^\s]*/gi, "smart engine")
    .replace(/ghostscript|ffmpeg|brotli|gzip|webp|wasm|qwen[^\s]*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
