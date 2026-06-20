export type FileCategory =
  | "video"
  | "pdf"
  | "image"
  | "audio"
  | "office"
  | "text"
  | "archive"
  | "other";

export type PdfContentHint = "likely-image-heavy" | "likely-text" | "unknown";

export type CompressionFileMeta = {
  fileName: string;
  extension: string;
  sizeBytes: number;
  category: FileCategory;
  pdfHint?: PdfContentHint;
};

export function categorizeExtension(ext: string): FileCategory {
  if ([".mp4", ".mov", ".mkv", ".avi", ".webm"].includes(ext)) return "video";
  if (ext === ".pdf") return "pdf";
  if ([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif", ".gif"].includes(ext)) {
    return "image";
  }
  if ([".mp3", ".wav", ".aac", ".flac", ".m4a", ".ogg"].includes(ext)) return "audio";
  if (
    [".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".odt", ".odp", ".ods"].includes(ext)
  ) {
    return "office";
  }
  if ([".txt", ".csv", ".json", ".xml", ".md", ".html", ".log"].includes(ext)) return "text";
  if ([".br", ".gz", ".zip"].includes(ext)) return "archive";
  return "other";
}

export function analyzePdfContent(buffer: Buffer): PdfContentHint {
  const sample = buffer
    .subarray(0, Math.min(buffer.length, 80_000))
    .toString("latin1");
  const imageMarkers =
    (sample.match(/\/DCTDecode|\/JPEG|\/JPXDecode|\/Image/g) || []).length;
  const textMarkers =
    (sample.match(/\/Font|\/Type1|\/TrueType|\/Subtype\s*\/Type1/g) || []).length;

  if (imageMarkers >= 8) return "likely-image-heavy";
  if (textMarkers > imageMarkers * 2) return "likely-text";
  return "unknown";
}

export function buildCompressionFileMeta(
  fileName: string,
  ext: string,
  sizeBytes: number,
  buffer: Buffer,
): CompressionFileMeta {
  const category = categorizeExtension(ext);
  return {
    fileName,
    extension: ext,
    sizeBytes,
    category,
    pdfHint: category === "pdf" ? analyzePdfContent(buffer) : undefined,
  };
}
