import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_BYTES = Number(process.env.WORKER_MAX_UPLOAD_MB ?? 100) * 1024 * 1024;

const VIDEO_EXTS = [".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v"];
const AUDIO_EXTS = [".wav", ".flac", ".ogg", ".m4a", ".aac", ".mp3"];

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

/** Aggressive PDF — /screen quality (72 dpi), smaller than /ebook. */
function compressPdf(inputPath, outPath) {
  run("gs", [
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.4",
    "-dPDFSETTINGS=/screen",
    "-dColorImageDownsampleType=/Bicubic",
    "-dColorImageResolution=72",
    "-dGrayImageDownsampleType=/Bicubic",
    "-dGrayImageResolution=72",
    "-dMonoImageDownsampleType=/Bicubic",
    "-dMonoImageResolution=72",
    "-dDetectDuplicateImages=true",
    "-dCompressFonts=true",
    "-dSubsetFonts=true",
    "-dEmbedAllFonts=true",
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    `-sOutputFile=${outPath}`,
    inputPath,
  ]);
}

function runJson(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: "utf8" });
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

function probeVideo(inputPath) {
  const data = runJson("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_entries",
    "format=duration,size,bit_rate",
    "-show_entries",
    "stream=codec_type,width,height,bit_rate",
    "-of",
    "json",
    inputPath,
  ]);
  if (!data) return null;

  const video = data.streams?.find((s) => s.codec_type === "video");
  const duration = Math.max(1, Number(data.format?.duration ?? 1));
  const size = Number(data.format?.size ?? sizeOf(inputPath));
  const formatBitrate = Number(data.format?.bit_rate ?? 0);

  return {
    duration,
    size,
    width: Number(video?.width ?? 0),
    height: Number(video?.height ?? 0),
    formatBitrate,
  };
}

function encodeVideoAttempt(inputPath, trialPath, probe, inputSize, sizeRatio) {
  const duration = probe?.duration ?? Math.max(1, inputSize / 250_000);
  const height = probe?.height ?? 720;
  const maxHeight = height <= 480 ? 480 : 720;
  const audioKbps = 48;

  let videoKbps;
  if (probe?.formatBitrate && probe.formatBitrate > 0) {
    const inputVideoKbps = Math.max(
      80,
      Math.floor(probe.formatBitrate / 1000) - audioKbps,
    );
    videoKbps = Math.max(80, Math.floor(inputVideoKbps * sizeRatio));
  } else {
    const targetBytes = Math.floor(inputSize * sizeRatio);
    videoKbps = Math.max(
      80,
      Math.floor((targetBytes * 8) / duration / 1000 - audioKbps),
    );
  }

  run("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vf",
    `scale=-2:'min(${maxHeight},ih)'`,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-b:v",
    `${videoKbps}k`,
    "-maxrate",
    `${Math.ceil(videoKbps * 1.1)}k`,
    "-bufsize",
    `${videoKbps * 2}k`,
    "-c:a",
    "aac",
    "-b:a",
    `${audioKbps}k`,
    "-ac",
    "1",
    "-movflags",
    "+faststart",
    trialPath,
  ]);
}

/**
 * Bitrate-targeted encode — never return a file larger than the input.
 * WhatsApp / phone videos are already heavily compressed; CRF re-encode often inflates size.
 */
function compressVideo(inputPath, outPath) {
  const inputSize = sizeOf(inputPath);
  const probe = probeVideo(inputPath);

  const sizeRatios = [0.6, 0.42];
  let bestSize = inputSize;
  let bestTemp = "";

  for (const ratio of sizeRatios) {
    const trialPath = outPath.replace(
      /\.mp4$/i,
      `.try${Math.round(ratio * 100)}.mp4`,
    );
    encodeVideoAttempt(inputPath, trialPath, probe, inputSize, ratio);

    const trialSize = sizeOf(trialPath);
    if (trialSize < bestSize) {
      if (bestTemp && fs.existsSync(bestTemp)) fs.unlinkSync(bestTemp);
      bestSize = trialSize;
      bestTemp = trialPath;
    } else {
      fs.unlinkSync(trialPath);
    }

    if (bestSize < inputSize * 0.88) break;
  }

  if (bestTemp && bestSize < inputSize) {
    fs.renameSync(bestTemp, outPath);
    return { keptOriginal: false };
  }

  if (bestTemp && fs.existsSync(bestTemp)) fs.unlinkSync(bestTemp);
  fs.copyFileSync(inputPath, outPath);
  return { keptOriginal: true };
}

function compressAudio(inputPath, outPath, ext) {
  const inputSize = sizeOf(inputPath);
  if (ext === ".wav" || ext === ".flac" || ext === ".ogg") {
    run("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "128k",
      outPath,
    ]);
  } else {
    run("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      outPath,
    ]);
  }
  if (sizeOf(outPath) >= inputSize) {
    fs.copyFileSync(inputPath, outPath);
  }
}

function mimeForExt(ext) {
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".m4a") return "audio/mp4";
  return "video/mp4";
}

export async function compressUploadedFile(file) {
  if (!file?.path) {
    throw new Error("No file uploaded.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error(
      `File exceeds worker limit (${process.env.WORKER_MAX_UPLOAD_MB ?? 100} MB).`,
    );
  }

  const ext = extOf(file.originalname);
  const jobId = randomUUID();
  const tmpRoot = path.join(os.tmpdir(), "click-compress-worker", jobId);
  fs.mkdirSync(tmpRoot, { recursive: true });

  const safeBase = path
    .basename(file.originalname, ext || undefined)
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  let outputPath = "";
  let outputName = "";
  let method = "";
  let note = "";

  try {
    if (ext === ".pdf") {
      outputName = `${safeBase}_compressed.pdf`;
      outputPath = path.join(tmpRoot, outputName);
      compressPdf(file.path, outputPath);
      method = "pdf-lossy-gs-screen";
      note = "PDF optimized (high compression) on GCP worker.";
    } else if (VIDEO_EXTS.includes(ext)) {
      outputName = `${safeBase}_compressed.mp4`;
      outputPath = path.join(tmpRoot, outputName);
      const videoResult = compressVideo(file.path, outputPath);
      method = videoResult.keptOriginal ? "video-pass-through" : "video-h264";
      note = videoResult.keptOriginal
        ? "Video was already heavily compressed (e.g. WhatsApp). Could not reduce size without quality loss — original quality kept."
        : "Video re-encoded with bitrate targeting on GCP worker.";
    } else if (AUDIO_EXTS.includes(ext)) {
      const outExt = [".wav", ".flac", ".ogg"].includes(ext) ? ".mp3" : ".m4a";
      outputName = `${safeBase}_compressed${outExt}`;
      outputPath = path.join(tmpRoot, outputName);
      compressAudio(file.path, outputPath, ext);
      method = "audio-compressed";
      note = "Audio compressed with FFmpeg on GCP worker.";
    } else {
      throw new Error(
        `Unsupported type on worker: ${ext || "unknown"}. Use PDF, video (mp4/mov/…), or audio (wav/mp3/…).`,
      );
    }

    if (!fs.existsSync(outputPath) || sizeOf(outputPath) === 0) {
      throw new Error("Compression produced empty output.");
    }

    const originalSize = file.size;
    let compressedSize = sizeOf(outputPath);

    if (VIDEO_EXTS.includes(ext) && compressedSize > originalSize) {
      fs.copyFileSync(file.path, outputPath);
      compressedSize = originalSize;
      method = "video-pass-through";
      note =
        "Video was already heavily compressed. Output matched original size.";
    }

    const savedPct =
      originalSize > 0
        ? (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)
        : "0";

    let finalNote = note;
    if (compressedSize >= originalSize) {
      finalNote =
        ext === ".pdf"
          ? `${note} Already well optimized — size unchanged.`
          : `${note} Size unchanged — file was already optimized for mobile sharing.`;
    } else {
      finalNote = `${note} Saved ${savedPct}%.`;
    }

    return {
      outputPath,
      tmpRoot,
      outputName,
      method,
      note: finalNote,
      originalSize,
      compressedSize,
      mimeType: mimeForExt(extOf(outputName)),
    };
  } catch (error) {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
      /* ignore cleanup errors */
    }
    throw error;
  } finally {
    try {
      fs.unlinkSync(file.path);
    } catch {
      /* ignore uploaded temp file cleanup */
    }
  }
}

export function cleanupJobDir(tmpRoot) {
  try {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch {
    /* ignore cleanup errors */
  }
}
