import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { requireBinary } from "@/lib/resolve-binary";
import {
  buildGhostscriptPdfArgs,
  pdfProfilesForMode,
  PDF_TARGET_SAVINGS_RATIO,
  resolvePdfProfiles,
  secondPassProfile,
  type PdfCompressMode,
  type PdfGsProfile,
} from "@/lib/pdf-ghostscript";

function runGs(args: string[]): void {
  const gs = requireBinary("gs", "Install with: brew install ghostscript");
  const result = spawnSync(gs, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      result.stderr?.trim() || "Ghostscript PDF compression failed.",
    );
  }
}

function isValidPdfFile(filePath: string): boolean {
  if (!fs.existsSync(filePath) || sizeOf(filePath) < 100) return false;
  const fd = fs.openSync(filePath, "r");
  try {
    const head = Buffer.alloc(4);
    fs.readSync(fd, head, 0, 4, 0);
    return head.toString() === "%PDF";
  } finally {
    fs.closeSync(fd);
  }
}

function sizeOf(filePath: string): number {
  return fs.statSync(filePath).size;
}

function pickSmallest(paths: string[]): string {
  const valid = paths.filter(isValidPdfFile);
  if (valid.length === 0) {
    throw new Error("PDF compression produced no valid output.");
  }
  return [...valid].sort((a, b) => sizeOf(a) - sizeOf(b))[0];
}

function tryProfile(
  inputPath: string,
  tmpRoot: string,
  jobId: string,
  safeBase: string,
  gsProfile: PdfGsProfile,
): { path: string; profile: PdfGsProfile } | null {
  const out = path.join(tmpRoot, `${jobId}_${safeBase}_${gsProfile.id}.pdf`);
  try {
    runGs(buildGhostscriptPdfArgs(inputPath, out, gsProfile));
    if (isValidPdfFile(out)) {
      return { path: out, profile: gsProfile };
    }
  } catch {
    // try next profile
  }
  return null;
}

export type PdfCompressResult = {
  outputPath: string;
  method: string;
  note: string;
  profileId: string;
};

export type PdfCompressOptions = {
  profilePriority?: string[];
  forceSecondPass?: boolean;
};

export function compressPdfAggressive(
  inputPath: string,
  tmpRoot: string,
  jobId: string,
  safeBase: string,
  mode: PdfCompressMode,
  originalSize: number,
  options?: PdfCompressOptions,
): PdfCompressResult {
  const profiles = resolvePdfProfiles(mode, options?.profilePriority);
  const candidates: { path: string; profile: PdfGsProfile }[] = [];

  for (const gsProfile of profiles) {
    const hit = tryProfile(inputPath, tmpRoot, jobId, safeBase, gsProfile);
    if (hit) candidates.push(hit);
  }

  if (candidates.length === 0) {
    throw new Error(
      "Could not compress this PDF. PDF optimization is unavailable on this server.",
    );
  }

  let best = pickSmallest(candidates.map((c) => c.path));
  let bestMeta = candidates.find((c) => c.path === best)!;
  let savings = 1 - sizeOf(best) / originalSize;

  if (savings < PDF_TARGET_SAVINGS_RATIO && (options?.forceSecondPass !== false)) {
    const pass2Profile = secondPassProfile();
    const pass2Out = path.join(tmpRoot, `${jobId}_${safeBase}_pass2.pdf`);
    try {
      runGs(buildGhostscriptPdfArgs(best, pass2Out, pass2Profile));
      if (isValidPdfFile(pass2Out) && sizeOf(pass2Out) < sizeOf(best)) {
        best = pass2Out;
        bestMeta = { path: pass2Out, profile: pass2Profile };
        savings = 1 - sizeOf(best) / originalSize;
      }
    } catch {
      // keep first-pass best
    }
  }

  if (savings < PDF_TARGET_SAVINGS_RATIO && mode !== "fast") {
    const ultraProfile = secondPassProfile();
    const directUltra = tryProfile(
      inputPath,
      tmpRoot,
      `${jobId}_retry`,
      safeBase,
      ultraProfile,
    );
    if (directUltra && sizeOf(directUltra.path) < sizeOf(best)) {
      best = directUltra.path;
      bestMeta = directUltra;
      savings = 1 - sizeOf(best) / originalSize;
    }
  }

  const savedPct = (savings * 100).toFixed(1);
  const hitTarget = savings >= PDF_TARGET_SAVINGS_RATIO;

  return {
    outputPath: best,
    profileId: bestMeta.profile.id,
    method: `pdf-lossy-gs-${bestMeta.profile.id}`,
    note: hitTarget
      ? `PDF optimized. Saved ${savedPct}% — embedded images were downsampled and re-encoded.`
      : `PDF optimized. Saved ${savedPct}%. Text-only PDFs compress less; image-heavy files typically reach 30–40%.`,
  };
}
