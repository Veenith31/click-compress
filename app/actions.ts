"use server";

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { compressPdfAggressive } from "@/lib/pdf-compress-server";
import type { PdfCompressMode } from "@/lib/pdf-ghostscript";
import { adviseCompressionStrategy } from "@/lib/ai-compression-advisor";
import { getSessionUser } from "@/lib/auth-server";
import { requireBinary, resolveBinary } from "@/lib/resolve-binary";
import {
  hasNativePdfTools,
  hasNativeVideoTools,
  isVercelServerless,
  serverMaxUploadBytes,
  serverOutputRoot,
  serverTempRoot,
} from "@/lib/server-runtime";
import { saveUserFile } from "@/lib/user-files-server";
import { buildQuickTimeFfmpegArgs } from "@/lib/video-ffmpeg-args";

export type NativeCompressionResponse =
  | {
      ok: true;
      method: string;
      note: string;
      aiNote?: string;
      savedToAccount?: boolean;
      userFileId?: string;
      outputName: string;
      downloadUrl: string;
      originalSize: number;
      compressedSize: number;
    }
  | {
      ok: false;
      error: string;
    };

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || `${command} failed`);
  }
}

function runTool(tool: string, args: string[]): void {
  run(requireBinary(tool, `Install with: brew install ${tool}`), args);
}

function hasTool(tool: string): boolean {
  return resolveBinary(tool) !== null;
}

function isValidVideoFile(filePath: string): boolean {
  if (!hasTool("ffprobe")) {
    return fs.existsSync(filePath) && sizeOf(filePath) > 0;
  }
  const result = spawnSync(
    requireBinary("ffprobe", "Install with: brew install ffmpeg"),
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=codec_name",
      "-of",
      "csv=p=0",
      filePath,
    ],
    { encoding: "utf8" },
  );
  return result.status === 0 && Boolean(result.stdout.trim());
}

function sizeOf(filePath: string): number {
  return fs.statSync(filePath).size;
}

function pickSmallest(paths: string[]): string {
  if (paths.length === 0) {
    throw new Error("No output candidates produced.");
  }
  return [...paths].sort((a, b) => sizeOf(a) - sizeOf(b))[0];
}

function compressWithBrotli(input: Buffer): Buffer {
  return zlib.brotliCompressSync(input, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    },
  });
}

function compressWithGzip(input: Buffer): Buffer {
  return zlib.gzipSync(input, { level: 9 });
}

function extensionFor(name: string): string {
  return path.extname(name || "").toLowerCase();
}

function detectContentExtension(buffer: Buffer): string {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString() === "%PDF") {
    return ".pdf";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return ".png";
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return ".jpg";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(4, 8).toString() === "ftyp"
  ) {
    return ".mp4";
  }
  if (
    buffer.length >= 5 &&
    (buffer.subarray(0, 5).toString().toLowerCase() === "<!doc" ||
      buffer.subarray(0, 5).toString().toLowerCase() === "<html")
  ) {
    return ".html";
  }
  return ".txt";
}

function prepareInputBuffer(
  fileName: string,
  rawBuffer: Buffer,
): { buffer: Buffer; ext: string; unpacked: boolean } {
  let ext = extensionFor(fileName);
  let buffer = rawBuffer;
  let unpacked = false;

  if (ext === ".br") {
    buffer = zlib.brotliDecompressSync(rawBuffer);
    ext = detectContentExtension(buffer);
    unpacked = true;
  } else if (ext === ".gz") {
    buffer = zlib.gunzipSync(rawBuffer);
    ext = detectContentExtension(buffer);
    unpacked = true;
  }

  return { buffer, ext, unpacked };
}

export async function compressNativeAction(
  formData: FormData,
): Promise<NativeCompressionResponse> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false, error: "No file uploaded." };
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    if (rawBuffer.length > serverMaxUploadBytes()) {
      const maxMb = (serverMaxUploadBytes() / (1024 * 1024)).toFixed(0);
      return {
        ok: false,
        error: `File is too large for cloud upload (max ${maxMb} MB on this host). Use a smaller file or switch to browser compression mode.`,
      };
    }

    const compressMode = String(formData.get("mode") ?? "max");
    const pdfLossy = formData.get("pdfLossy") === "true";
    const useAi = formData.get("useAi") !== "false";

    const { plan: aiPlan, aiUsed } = await adviseCompressionStrategy(
      file.name,
      extensionFor(file.name) || detectContentExtension(rawBuffer),
      rawBuffer,
      useAi,
    );

    let pdfMode: PdfCompressMode = aiPlan.pdfMode;
    if (!useAi) {
      pdfMode =
        compressMode === "fast" || compressMode === "balanced"
          ? compressMode
          : "max";
      if (pdfLossy) pdfMode = "max";
    } else if (pdfLossy) {
      pdfMode = "max";
    }

    const aiNote = aiUsed
      ? `Smart routing: ${aiPlan.reason}`
      : undefined;
    const prepared = prepareInputBuffer(file.name, rawBuffer);
    const inputBuffer = prepared.buffer;
    const ext = prepared.ext;
    const jobId = randomUUID();
    const tmpRoot = path.join(serverTempRoot(), jobId);
    const publicOutRoot = serverOutputRoot();
    fs.mkdirSync(tmpRoot, { recursive: true });
    fs.mkdirSync(publicOutRoot, { recursive: true });

    const originalExt = extensionFor(file.name);
    const safeBase = path
      .basename(file.name, originalExt || undefined)
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const inputPath = path.join(tmpRoot, `${jobId}_${safeBase}${ext || ""}`);
    fs.writeFileSync(inputPath, inputBuffer);

    let outputPath = "";
    let outputName = "";
    let method = "";
    let note = prepared.unpacked
      ? "Decompressed archive wrapper, then optimized inner content. "
      : "";
    let resultAiNote = aiNote;

    if ([".mp4", ".mov", ".mkv", ".avi"].includes(ext)) {
      if (!hasNativeVideoTools()) {
        return {
          ok: false,
          error:
            "Video processing is unavailable on this server. Try in-browser mode or contact your administrator.",
        };
      }
      outputName = `${safeBase}_compressed.mp4`;
      outputPath = path.join(publicOutRoot, `${jobId}_${outputName}`);
      const h264Candidate = path.join(tmpRoot, `${jobId}_${safeBase}_h264.mp4`);
      const hevcCandidate = path.join(tmpRoot, `${jobId}_${safeBase}_hevc.mp4`);

      runTool("ffmpeg", buildQuickTimeFfmpegArgs(inputPath, h264Candidate, "h264"));
      runTool("ffmpeg", buildQuickTimeFfmpegArgs(inputPath, hevcCandidate, "hevc"));

      const validCandidates = [h264Candidate, hevcCandidate].filter(isValidVideoFile);
      if (validCandidates.length === 0) {
        throw new Error("Video encoding failed — no playable output was produced.");
      }

      const bestVideo = pickSmallest(validCandidates);
      fs.copyFileSync(bestVideo, outputPath);
      method = bestVideo === hevcCandidate ? "video-hevc-hvc1" : "video-h264";
      note +=
        bestVideo === hevcCandidate
          ? "Video re-encoded for smaller size with broad device compatibility."
          : "Video re-encoded for maximum player compatibility.";
    } else if (ext === ".pdf") {
      if (!hasNativePdfTools()) {
        return {
          ok: false,
          error:
            "PDF optimization is not available on cloud hosting (Ghostscript is not installed). Compress this PDF locally at clickcompress.com on your Mac, or use a file under 4 MB with browser mode.",
        };
      }
      outputName = `${safeBase}_compressed.pdf`;
      const pdfResult = compressPdfAggressive(
        inputPath,
        tmpRoot,
        jobId,
        safeBase,
        pdfMode,
        rawBuffer.length,
        {
          profilePriority: useAi ? aiPlan.pdfProfilePriority : undefined,
          forceSecondPass: useAi ? aiPlan.forceSecondPass : true,
        },
      );
      outputPath = path.join(publicOutRoot, `${jobId}_${outputName}`);
      fs.copyFileSync(pdfResult.outputPath, outputPath);
      method = pdfResult.method;
      note += pdfResult.note;
    } else if ([".jpg", ".jpeg"].includes(ext)) {
      outputName = `${safeBase}_compressed.jpg`;
      const jpegQualities =
        aiPlan.imageAggression === "high"
          ? ["45", "35"]
          : aiPlan.imageAggression === "light"
            ? ["70", "60"]
            : ["60", "45"];
      const jpegQ60 = path.join(tmpRoot, `${jobId}_${safeBase}_q${jpegQualities[0]}.jpg`);
      const jpegQ45 = path.join(tmpRoot, `${jobId}_${safeBase}_q${jpegQualities[1]}.jpg`);
      if (hasTool("sips")) {
        runTool("sips", [
          "-s",
          "format",
          "jpeg",
          "-s",
          "formatOptions",
          jpegQualities[0],
          inputPath,
          "--out",
          jpegQ60,
        ]);
        runTool("sips", [
          "-s",
          "format",
          "jpeg",
          "-s",
          "formatOptions",
          jpegQualities[1],
          inputPath,
          "--out",
          jpegQ45,
        ]);
      } else if (hasTool("ffmpeg")) {
        runTool("ffmpeg", ["-y", "-i", inputPath, "-q:v", "6", jpegQ60]);
        runTool("ffmpeg", ["-y", "-i", inputPath, "-q:v", "9", jpegQ45]);
      } else {
        return {
          ok: false,
          error: "Image processing is unavailable on this server.",
        };
      }
      const bestJpeg = pickSmallest([jpegQ60, jpegQ45]);
      outputPath = path.join(publicOutRoot, `${jobId}_${outputName}`);
      fs.copyFileSync(bestJpeg, outputPath);
      method = "jpeg-quality-opt";
      note +=
        "JPEG recompressed with quality sweep and smallest output selected.";
    } else if ([".png", ".webp", ".bmp", ".tiff", ".tif"].includes(ext)) {
      if (!hasTool("ffmpeg")) {
        return {
          ok: false,
          error:
            "Video processing is unavailable on this server. Try in-browser mode or contact your administrator.",
        };
      }
      outputName = `${safeBase}_compressed.webp`;
      const webpQ70 = path.join(tmpRoot, `${jobId}_${safeBase}_q70.webp`);
      const webpQ55 = path.join(tmpRoot, `${jobId}_${safeBase}_q55.webp`);
      const webpLossless = path.join(
        tmpRoot,
        `${jobId}_${safeBase}_lossless.webp`,
      );
      runTool("ffmpeg", [
        "-y",
        "-i",
        inputPath,
        "-c:v",
        "libwebp",
        "-q:v",
        "70",
        webpQ70,
      ]);
      runTool("ffmpeg", [
        "-y",
        "-i",
        inputPath,
        "-c:v",
        "libwebp",
        "-q:v",
        "55",
        webpQ55,
      ]);
      runTool("ffmpeg", [
        "-y",
        "-i",
        inputPath,
        "-c:v",
        "libwebp",
        "-lossless",
        "1",
        webpLossless,
      ]);
      const bestImage = pickSmallest([webpQ70, webpQ55, webpLossless]);
      outputPath = path.join(publicOutRoot, `${jobId}_${outputName}`);
      fs.copyFileSync(bestImage, outputPath);
      method = "image-webp-sweep";
      note +=
        "Image recompressed with a quality sweep; smallest output selected.";
    } else if (
      [".csv", ".txt", ".json", ".xml", ".md", ".log", ".html"].includes(ext)
    ) {
      outputName = `${safeBase}${ext}.br`;
      outputPath = path.join(publicOutRoot, `${jobId}_${outputName}`);
      const compressed = compressWithBrotli(inputBuffer);
      fs.writeFileSync(outputPath, compressed);
      method = "brotli-huffman";
      note += "Text file compressed with maximum-effort lossless encoding.";
    } else if (
      [
        ".doc",
        ".docx",
        ".ppt",
        ".pptx",
        ".xls",
        ".xlsx",
        ".odt",
        ".odp",
        ".ods",
        ".rtf",
      ].includes(ext)
    ) {
      const brotliOutput = path.join(tmpRoot, `${jobId}_${safeBase}${ext}.br`);
      const gzipOutput = path.join(tmpRoot, `${jobId}_${safeBase}${ext}.gz`);
      fs.writeFileSync(brotliOutput, compressWithBrotli(inputBuffer));
      fs.writeFileSync(gzipOutput, compressWithGzip(inputBuffer));
      const bestOffice = pickSmallest([brotliOutput, gzipOutput]);
      const bestIsBrotli = bestOffice.endsWith(".br");
      outputName = `${safeBase}${ext}.${bestIsBrotli ? "br" : "gz"}`;
      outputPath = path.join(publicOutRoot, `${jobId}_${outputName}`);
      fs.copyFileSync(bestOffice, outputPath);
      method = bestIsBrotli ? "office-brotli" : "office-gzip";
      note +=
        "Office document packed with dual lossless strategies; smallest output selected.";
    } else {
      const brotliOutput = path.join(tmpRoot, `${jobId}_${safeBase}${ext}.br`);
      const gzipOutput = path.join(tmpRoot, `${jobId}_${safeBase}${ext}.gz`);
      fs.writeFileSync(brotliOutput, compressWithBrotli(inputBuffer));
      fs.writeFileSync(gzipOutput, compressWithGzip(inputBuffer));
      const bestGeneric = pickSmallest([brotliOutput, gzipOutput]);
      const bestIsBrotli = bestGeneric.endsWith(".br");
      outputName = `${safeBase}${ext}.${bestIsBrotli ? "br" : "gz"}`;
      outputPath = path.join(publicOutRoot, `${jobId}_${outputName}`);
      fs.copyFileSync(bestGeneric, outputPath);
      method = bestIsBrotli ? "generic-brotli" : "deflate-lz77-huffman";
      note +=
        "File compressed with dual lossless strategies; smallest output selected.";
    }

    const originalSize = rawBuffer.length;
    const compressedSize = sizeOf(outputPath);
    const sessionUser = await getSessionUser();

    let downloadUrl = isVercelServerless()
      ? `/api/compress-output/${encodeURIComponent(path.basename(outputPath))}`
      : `/generated/${path.basename(outputPath)}`;
    let savedToAccount = false;
    let userFileId: string | undefined;

    if (sessionUser) {
      try {
        const record = await saveUserFile({
          userId: sessionUser.id,
          plainBuffer: fs.readFileSync(outputPath),
          originalName: file.name,
          outputName,
          originalSize,
          compressedSize,
          method,
          note: note.trim() || undefined,
        });
        savedToAccount = true;
        userFileId = record.id;
        downloadUrl = `/api/my-files/${record.id}/download`;
        try {
          fs.unlinkSync(outputPath);
        } catch {
          /* keep public copy if cleanup fails */
        }
      } catch {
        downloadUrl = `/generated/${path.basename(outputPath)}`;
        note +=
          " Could not save to your account — download below. Set up file storage (R2) on production.";
      }
    }

    return {
      ok: true,
      method,
      note: savedToAccount
        ? `${note} Saved securely to your account (encrypted at rest).`
        : note,
      aiNote: resultAiNote,
      savedToAccount,
      userFileId,
      outputName,
      downloadUrl,
      originalSize,
      compressedSize,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Native compression failed.",
    };
  }
}
