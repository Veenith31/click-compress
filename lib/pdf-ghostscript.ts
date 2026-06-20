/**
 * Ghostscript profiles for lossy PDF recompression (force JPEG re-encode + downsampling).
 * Server-side only — typical 30–45% on image-heavy PDFs.
 */

export type PdfCompressMode = "fast" | "balanced" | "max";

export type PdfGsProfile = {
  id: string;
  label: string;
  extraArgs: string[];
};

/** Re-encode embedded images instead of passing them through (~4% → 30%+). */
const FORCE_LOSSY_REENCODE = [
  "-dPassThroughJPEGImages=false",
  "-dPassThroughJPXImages=false",
  "-dPassThroughColorImages=false",
  "-dPassThroughGrayImages=false",
];

const GS_BASE = [
  "-sDEVICE=pdfwrite",
  "-dCompatibilityLevel=1.4",
  "-dNOPAUSE",
  "-dQUIET",
  "-dBATCH",
  "-dDetectDuplicateImages=true",
  "-dCompressFonts=true",
  "-dSubsetFonts=true",
  "-dOptimize=true",
  ...FORCE_LOSSY_REENCODE,
];

function profile(
  id: string,
  label: string,
  extraArgs: string[],
): PdfGsProfile {
  return { id, label, extraArgs };
}

function aggressive(dpi: number, jpegQ: number): PdfGsProfile {
  return profile(`lossy-${dpi}dpi-q${jpegQ}`, `Lossy ${dpi} DPI · JPEG Q${jpegQ}`, [
    "-dPDFSETTINGS=/screen",
    "-dDownsampleColorImages=true",
    "-dDownsampleGrayImages=true",
    "-dDownsampleMonoImages=true",
    "-dColorImageDownsampleType=/Bicubic",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dMonoImageDownsampleType=/Bicubic",
    "-dColorImageDownsampleThreshold=1.0",
    "-dGrayImageDownsampleThreshold=1.0",
    "-dMonoImageDownsampleThreshold=1.0",
    `-dColorImageResolution=${dpi}`,
    `-dGrayImageResolution=${dpi}`,
    `-dMonoImageResolution=${Math.max(dpi, 100)}`,
    "-dEncodeColorImages=true",
    "-dEncodeGrayImages=true",
    "-dEncodeMonoImages=true",
    "-dAutoFilterColorImages=false",
    "-dAutoFilterGrayImages=false",
    "-dColorImageFilter=/DCTEncode",
    "-dGrayImageFilter=/DCTEncode",
    `-dJPEGQ=${jpegQ}`,
  ]);
}

const EBOOK = profile("ebook", "PDF /ebook preset", ["-dPDFSETTINGS=/ebook"]);

const SCREEN = profile("screen", "PDF /screen preset", [
  "-dPDFSETTINGS=/screen",
]);

const ULTRA_50 = profile("ultra-50", "Ultra 50 DPI · JPEG Q32", [
  "-dPDFSETTINGS=/screen",
  "-dDownsampleColorImages=true",
  "-dDownsampleGrayImages=true",
  "-dColorImageDownsampleType=/Bicubic",
  "-dGrayImageDownsampleType=/Bicubic",
  "-dColorImageDownsampleThreshold=1.0",
  "-dGrayImageDownsampleThreshold=1.0",
  "-dColorImageResolution=50",
  "-dGrayImageResolution=50",
  "-dMonoImageResolution=120",
  "-dEncodeColorImages=true",
  "-dEncodeGrayImages=true",
  "-dAutoFilterColorImages=false",
  "-dColorImageFilter=/DCTEncode",
  "-dGrayImageFilter=/DCTEncode",
  "-dJPEGQ=32",
]);

const EXTREME_40 = profile("extreme-40", "Extreme 40 DPI · JPEG Q28", [
  "-dPDFSETTINGS=/screen",
  "-dDownsampleColorImages=true",
  "-dDownsampleGrayImages=true",
  "-dColorImageDownsampleType=/Bicubic",
  "-dGrayImageDownsampleType=/Bicubic",
  "-dColorImageDownsampleThreshold=1.0",
  "-dGrayImageDownsampleThreshold=1.0",
  "-dColorImageResolution=40",
  "-dGrayImageResolution=40",
  "-dMonoImageResolution=100",
  "-dEncodeColorImages=true",
  "-dEncodeGrayImages=true",
  "-dAutoFilterColorImages=false",
  "-dColorImageFilter=/DCTEncode",
  "-dGrayImageFilter=/DCTEncode",
  "-dJPEGQ=28",
]);

/** Order: strongest lossy passes first, then lighter presets as fallback. */
export function pdfProfilesForMode(mode: PdfCompressMode): PdfGsProfile[] {
  switch (mode) {
    case "fast":
      return [aggressive(96, 55), aggressive(72, 45), SCREEN, EBOOK];
    case "balanced":
      return [
        aggressive(72, 42),
        aggressive(96, 50),
        ULTRA_50,
        SCREEN,
        EBOOK,
      ];
    case "max":
    default:
      return [
        EXTREME_40,
        ULTRA_50,
        aggressive(50, 35),
        aggressive(72, 40),
        aggressive(96, 48),
        SCREEN,
        EBOOK,
      ];
  }
}

export function buildGhostscriptPdfArgs(
  inputPath: string,
  outputPath: string,
  gsProfile: PdfGsProfile,
): string[] {
  return [
    ...GS_BASE,
    ...gsProfile.extraArgs,
    `-sOutputFile=${outputPath}`,
    inputPath,
  ];
}

export const PDF_TARGET_SAVINGS_RATIO = 0.3;

/** Profile for second-pass recompression when first pass is below target. */
export function secondPassProfile(): PdfGsProfile {
  return EXTREME_40;
}

/** Resolve AI-suggested profile order, then append remaining defaults for mode. */
export function resolvePdfProfiles(
  mode: PdfCompressMode,
  priorityIds?: string[],
): PdfGsProfile[] {
  const byId = new Map<string, PdfGsProfile>();
  for (const m of ["fast", "balanced", "max"] as const) {
    for (const p of pdfProfilesForMode(m)) {
      byId.set(p.id, p);
    }
  }

  const defaults = pdfProfilesForMode(mode);
  if (!priorityIds?.length) return defaults;

  const ordered: PdfGsProfile[] = [];
  for (const id of priorityIds) {
    const p = byId.get(id);
    if (p && !ordered.some((x) => x.id === p.id)) ordered.push(p);
  }
  for (const p of defaults) {
    if (!ordered.some((x) => x.id === p.id)) ordered.push(p);
  }
  return ordered;
}
