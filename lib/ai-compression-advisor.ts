import {
  buildCompressionFileMeta,
  type CompressionFileMeta,
} from "@/lib/compression-file-meta";
import {
  isOpenRouterConfigured,
  openRouterChat,
  parseJsonFromModel,
} from "@/lib/openrouter";
import type { PdfCompressMode } from "@/lib/pdf-ghostscript";
import { resolvePdfProfiles } from "@/lib/pdf-ghostscript";

export type CompressionAiPlan = {
  pdfMode: PdfCompressMode;
  pdfProfilePriority: string[];
  forceSecondPass: boolean;
  videoPreference: "hevc-first" | "h264-first" | "smallest";
  imageAggression: "high" | "balanced" | "light";
  reason: string;
};

const VALID_PDF_PROFILES = new Set(
  resolvePdfProfiles("max", [
    "extreme-40",
    "ultra-50",
    "lossy-50dpi-q35",
    "lossy-72dpi-q40",
    "lossy-72dpi-q42",
    "lossy-72dpi-q45",
    "lossy-96dpi-q48",
    "lossy-96dpi-q50",
    "lossy-96dpi-q55",
    "screen",
    "ebook",
  ]).map((p) => p.id),
);

const SYSTEM_PROMPT = `You are a compression strategy advisor for Click-Compress.
You NEVER compress files yourself. You output JSON only to guide native tools:
Ghostscript (PDF), ffmpeg (video), Brotli/Gzip (text), image quality sweeps.

Rules:
- Image-heavy or large PDFs: pdfMode "max", prioritize extreme-40 and ultra-50, forceSecondPass true
- Text-heavy PDFs: pdfMode "balanced", prioritize lossy-72dpi-q40 then ultra-50
- Large video (>10MB): videoPreference "hevc-first" or "smallest"
- Images: imageAggression "high" for photos, "balanced" for UI screenshots
- Target ~30-40% savings on PDFs when possible; up to 80% for scan-heavy PDFs with extreme profiles

Respond with ONLY valid JSON:
{
  "pdfMode": "fast" | "balanced" | "max",
  "pdfProfilePriority": ["extreme-40", "ultra-50", ...],
  "forceSecondPass": boolean,
  "videoPreference": "hevc-first" | "h264-first" | "smallest",
  "imageAggression": "high" | "balanced" | "light",
  "reason": "one short sentence"
}`;

function defaultPlan(meta: CompressionFileMeta): CompressionAiPlan {
  if (meta.category === "pdf") {
    if (meta.pdfHint === "likely-image-heavy" || meta.sizeBytes > 2_000_000) {
      return {
        pdfMode: "max",
        pdfProfilePriority: ["extreme-40", "ultra-50", "lossy-50dpi-q35"],
        forceSecondPass: true,
        videoPreference: "smallest",
        imageAggression: "high",
        reason: "Large or image-heavy PDF — using maximum optimization.",
      };
    }
    return {
      pdfMode: "balanced",
      pdfProfilePriority: ["ultra-50", "lossy-72dpi-q40", "lossy-96dpi-q48"],
      forceSecondPass: true,
      videoPreference: "smallest",
      imageAggression: "balanced",
      reason: "Standard PDF — balanced optimization pass.",
    };
  }

  if (meta.category === "video") {
    return {
      pdfMode: "max",
      pdfProfilePriority: ["extreme-40"],
      forceSecondPass: false,
      videoPreference: meta.sizeBytes > 10_000_000 ? "hevc-first" : "smallest",
      imageAggression: "balanced",
      reason: "Video — dual encode pass, smallest output selected.",
    };
  }

  return {
    pdfMode: "max",
    pdfProfilePriority: ["extreme-40", "ultra-50"],
    forceSecondPass: false,
    videoPreference: "smallest",
    imageAggression: meta.category === "image" ? "high" : "balanced",
    reason: "Default smart routing.",
  };
}

function sanitizePlan(raw: unknown, meta: CompressionFileMeta): CompressionAiPlan {
  const fallback = defaultPlan(meta);
  if (!raw || typeof raw !== "object") return fallback;

  const o = raw as Record<string, unknown>;
  const pdfMode =
    o.pdfMode === "fast" || o.pdfMode === "balanced" || o.pdfMode === "max"
      ? o.pdfMode
      : fallback.pdfMode;

  let pdfProfilePriority = fallback.pdfProfilePriority;
  if (Array.isArray(o.pdfProfilePriority)) {
    const filtered = o.pdfProfilePriority
      .filter((id): id is string => typeof id === "string")
      .filter((id) => VALID_PDF_PROFILES.has(id));
    if (filtered.length > 0) pdfProfilePriority = filtered;
  }

  const videoPreference =
    o.videoPreference === "hevc-first" ||
    o.videoPreference === "h264-first" ||
    o.videoPreference === "smallest"
      ? o.videoPreference
      : fallback.videoPreference;

  const imageAggression =
    o.imageAggression === "high" ||
    o.imageAggression === "balanced" ||
    o.imageAggression === "light"
      ? o.imageAggression
      : fallback.imageAggression;

  return {
    pdfMode,
    pdfProfilePriority,
    forceSecondPass: Boolean(o.forceSecondPass ?? fallback.forceSecondPass),
    videoPreference,
    imageAggression,
    reason:
      typeof o.reason === "string" && o.reason.trim()
        ? o.reason.trim()
        : fallback.reason,
  };
}

export async function adviseCompressionStrategy(
  fileName: string,
  ext: string,
  buffer: Buffer,
  enabled: boolean,
): Promise<{ plan: CompressionAiPlan; aiUsed: boolean }> {
  const meta = buildCompressionFileMeta(fileName, ext, buffer.length, buffer);
  const fallback = defaultPlan(meta);

  if (!enabled || !isOpenRouterConfigured()) {
    return { plan: fallback, aiUsed: false };
  }

  try {
    const userPrompt = `File metadata:
- name: ${meta.fileName}
- extension: ${meta.extension}
- size bytes: ${meta.sizeBytes}
- category: ${meta.category}
${meta.pdfHint ? `- pdf content hint: ${meta.pdfHint}` : ""}

Choose the best compression strategy JSON.`;

    const reply = await openRouterChat([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ]);

    const plan = sanitizePlan(parseJsonFromModel(reply), meta);
    return { plan, aiUsed: true };
  } catch {
    return { plan: fallback, aiUsed: false };
  }
}

export async function adviseRetryAfterLowSavings(
  meta: CompressionFileMeta,
  savedPercent: number,
): Promise<CompressionAiPlan | null> {
  if (!isOpenRouterConfigured() || savedPercent >= 30) return null;

  try {
    const reply = await openRouterChat([
      {
        role: "system",
        content:
          "Compression saved less than 30%. Reply JSON only with stronger settings. Use pdfMode max, pdfProfilePriority starting with extreme-40, forceSecondPass true.",
      },
      {
        role: "user",
        content: `Category: ${meta.category}, pdfHint: ${meta.pdfHint ?? "n/a"}, saved: ${savedPercent.toFixed(1)}%. Output strategy JSON.`,
      },
    ]);
    return sanitizePlan(parseJsonFromModel(reply), meta);
  } catch {
    return null;
  }
}
