import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_BYTES = Number(process.env.WORKER_MAX_UPLOAD_MB ?? 100) * 1024 * 1024;

function extOf(name) {
  return path.extname(name || "").toLowerCase();
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || `${cmd} failed`);
  }
}

function sizeOf(p) {
  return fs.statSync(p).size;
}

function compressPdf(inputPath, outPath) {
  run("gs", [
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.4",
    "-dPDFSETTINGS=/ebook",
    "-dColorImageDownsampleType=/Bicubic",
    "-dColorImageResolution=96",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dGrayImageResolution=96",
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    `-sOutputFile=${outPath}`,
    inputPath,
  ]);
}

function compressVideo(inputPath, outPath) {
  run("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "28",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outPath,
  ]);
}

export async function compressUploadedFile(file) {
  if (!file?.buffer?.length) {
    throw new Error("No file uploaded.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`File exceeds worker limit (${process.env.WORKER_MAX_UPLOAD_MB ?? 100} MB).`);
  }

  const ext = extOf(file.originalname);
  const jobId = randomUUID();
  const tmpRoot = path.join(os.tmpdir(), "click-compress-worker", jobId);
  fs.mkdirSync(tmpRoot, { recursive: true });

  const safeBase = path
    .basename(file.originalname, ext || undefined)
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const inputPath = path.join(tmpRoot, `${safeBase}${ext || ""}`);
  fs.writeFileSync(inputPath, file.buffer);

  let outputPath = "";
  let outputName = "";
  let method = "";
  let note = "";

  try {
    if (ext === ".pdf") {
      outputName = `${safeBase}_compressed.pdf`;
      outputPath = path.join(tmpRoot, outputName);
      compressPdf(inputPath, outputPath);
      method = "pdf-lossy-gs-ebook";
      note = "PDF optimized with Ghostscript on compression worker.";
    } else if ([".mp4", ".mov", ".mkv", ".avi"].includes(ext)) {
      outputName = `${safeBase}_compressed.mp4`;
      outputPath = path.join(tmpRoot, outputName);
      compressVideo(inputPath, outputPath);
      method = "video-h264";
      note = "Video re-encoded with FFmpeg on compression worker.";
    } else {
      throw new Error(
        `Unsupported type on worker: ${ext || "unknown"}. Use PDF or video.`,
      );
    }

    if (!fs.existsSync(outputPath) || sizeOf(outputPath) === 0) {
      throw new Error("Compression produced empty output.");
    }

    const originalSize = file.size;
    const compressedSize = sizeOf(outputPath);
    const savedPct =
      originalSize > 0
        ? (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)
        : "0";

    return {
      buffer: fs.readFileSync(outputPath),
      outputName,
      method,
      note: `${note} Saved ${savedPct}%.`,
      originalSize,
      compressedSize,
      mimeType: ext === ".pdf" ? "application/pdf" : "video/mp4",
    };
  } finally {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
      /* ignore cleanup errors */
    }
  }
}
