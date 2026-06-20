"use client";

import { gunzipSync, gzipSync } from "fflate";

export type CompressionMode = "fast" | "balanced" | "max";
export type OptimizationProfile = "smart" | "text" | "media";
export type CompressionGoal = "strict-lossless" | "target-40" | "high-impact-local";

export const TARGET_SAVINGS_RATIO = 0.4;

export type CompressionCandidate = {
  method: string;
  data: Uint8Array;
  note: string;
  extension: string;
};

export type ImageCompressionResult = {
  blob: Blob;
  method: string;
  note: string;
  extension: string;
  targetHit: boolean;
};

type BrotliApi = {
  compress: (buf: Uint8Array, options?: { quality?: number }) => Uint8Array;
  decompress: (buf: Uint8Array) => Uint8Array;
};

let brotliInstancePromise: Promise<BrotliApi> | null = null;

function getBrotli(): Promise<BrotliApi> {
  if (typeof window === "undefined") {
    throw new Error("Compression runs in the browser only.");
  }
  if (!brotliInstancePromise) {
    brotliInstancePromise = import("brotli-wasm").then((mod) => mod.default);
  }
  return brotliInstancePromise;
}

function toBinaryString(data: Uint8Array): string {
  let text = "";
  for (let i = 0; i < data.length; i += 1) {
    text += String.fromCharCode(data[i]);
  }
  return text;
}

function fromBinaryString(data: string): Uint8Array {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 1) {
    out[i] = data.charCodeAt(i) & 0xff;
  }
  return out;
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function rleCompress(input: Uint8Array): Uint8Array {
  if (input.length === 0) return input;
  const out: number[] = [];
  let count = 1;
  for (let i = 1; i <= input.length; i += 1) {
    if (i < input.length && input[i] === input[i - 1] && count < 255) {
      count += 1;
    } else {
      out.push(count, input[i - 1]);
      count = 1;
    }
  }
  return new Uint8Array(out);
}

function rleDecompress(input: Uint8Array): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < input.length; i += 2) {
    const count = input[i];
    const value = input[i + 1];
    for (let j = 0; j < count; j += 1) {
      out.push(value);
    }
  }
  return new Uint8Array(out);
}

function lzwCompress(input: Uint8Array): Uint8Array {
  if (input.length === 0) return input;

  const source = toBinaryString(input);
  const dictionary = new Map<string, number>();
  for (let i = 0; i < 256; i += 1) {
    dictionary.set(String.fromCharCode(i), i);
  }

  const codes: number[] = [];
  let current = source[0];
  let dictSize = 256;

  for (let i = 1; i < source.length; i += 1) {
    const char = source[i];
    const combined = current + char;
    if (dictionary.has(combined)) {
      current = combined;
    } else {
      codes.push(dictionary.get(current)!);
      dictionary.set(combined, dictSize);
      dictSize += 1;
      current = char;
    }
  }

  codes.push(dictionary.get(current)!);
  return new Uint8Array(new Uint16Array(codes).buffer);
}

function lzwDecompress(input: Uint8Array): Uint8Array {
  if (input.length === 0) return input;
  const codeView = new Uint16Array(
    input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength),
  );
  const codes = Array.from(codeView);

  const dictionary: string[] = [];
  for (let i = 0; i < 256; i += 1) {
    dictionary[i] = String.fromCharCode(i);
  }

  let previous = dictionary[codes[0]];
  let output = previous;

  for (let i = 1; i < codes.length; i += 1) {
    const currentCode = codes[i];
    let entry = dictionary[currentCode];
    if (!entry && currentCode === dictionary.length) {
      entry = previous + previous[0];
    }
    if (!entry) throw new Error("Invalid LZW stream.");
    output += entry;
    dictionary.push(previous + entry[0]);
    previous = entry;
  }

  return fromBinaryString(output);
}

function isTextLikeFile(fileType: string): boolean {
  if (fileType.startsWith("text/")) return true;
  return [
    "application/json",
    "application/xml",
    "application/javascript",
    "application/x-javascript",
    "application/sql",
    "image/svg+xml",
  ].includes(fileType);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export function targetBytesFor(originalSize: number): number {
  return Math.floor(originalSize * (1 - TARGET_SAVINGS_RATIO));
}

export type CompressionProgressUpdate = {
  percent: number;
  label: string;
};

export type CompressionProgressCallback = (
  update: CompressionProgressUpdate,
) => void;

export async function bestLosslessCompression(
  data: Uint8Array,
  mode: CompressionMode,
  profile: OptimizationProfile,
  fileType: string,
  onProgress?: CompressionProgressCallback,
): Promise<CompressionCandidate> {
  const compressionLevel = (mode === "fast" ? 6 : 9) as 6 | 9;
  const brotliQualities =
    mode === "fast"
      ? [8, 10, 11]
      : mode === "balanced"
        ? [9, 10, 11]
        : [11, 10, 9, 8];
  const allowHeavyDictionary = data.length <= 8 * 1024 * 1024;
  const textLike = isTextLikeFile(fileType);

  const report = (percent: number, label: string) => {
    onProgress?.({
      percent: Math.min(100, Math.max(0, Math.round(percent))),
      label,
    });
  };

  report(5, "Preparing lossless compression…");

  const candidates: CompressionCandidate[] = [
    {
      method: "store-copy",
      data,
      note: "File appears already compressed; no smaller lossless output found.",
      extension: "original",
    },
  ];

  report(15, "Trying GZIP (Deflate)…");
  const gzipData = gzipSync(data, { level: compressionLevel });
  if (arraysEqual(gunzipSync(gzipData), data)) {
    candidates.push({
      method: "deflate-lz77-huffman",
      data: gzipData,
      note: "Lossless compression applied.",
      extension: "gz",
    });
  }

  if (profile !== "media" || textLike) {
    report(30, "Loading compression engine…");
    const brotli = await getBrotli();
    for (let i = 0; i < brotliQualities.length; i += 1) {
      const quality = brotliQualities[i];
      report(
        35 + (i / brotliQualities.length) * 25,
        `Trying lossless pass ${quality}…`,
      );
      const brotliData = brotli.compress(data, { quality });
      if (!arraysEqual(brotli.decompress(brotliData), data)) continue;
      candidates.push({
        method: "brotli-huffman",
        data: brotliData,
        note: "Lossless compression applied.",
        extension: "br",
      });
    }
  }

  if (allowHeavyDictionary && (profile !== "media" || textLike)) {
    report(65, "Trying run-length encoding…");
    const rleData = rleCompress(data);
    if (arraysEqual(rleDecompress(rleData), data)) {
      candidates.push({
        method: "rle",
        data: rleData,
        note: "Lossless compression for repeated byte patterns.",
        extension: "rle",
      });
    }
  }

  if (allowHeavyDictionary && profile !== "media") {
    report(78, "Trying LZW dictionary coding…");
    const lzwData = lzwCompress(data);
    if (arraysEqual(lzwDecompress(lzwData), data)) {
      candidates.push({
        method: "lzw-dictionary",
        data: lzwData,
        note: "Lossless dictionary compression applied.",
        extension: "lzw",
      });
    }
  }

  report(92, "Selecting smallest lossless output…");
  const best = candidates.sort((a, b) => a.data.length - b.data.length)[0];
  report(100, "Lossless compression complete");
  return best;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not encode image."));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}

export async function compressImageTowardTarget(
  file: File,
  targetBytes: number,
  mode: CompressionMode,
  onProgress?: CompressionProgressCallback,
): Promise<ImageCompressionResult> {
  const sourceBitmap = await createImageBitmap(file);
  const width = sourceBitmap.width;
  const height = sourceBitmap.height;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    sourceBitmap.close();
    throw new Error("Canvas context unavailable.");
  }

  const qualitySteps =
    mode === "fast"
      ? [0.8, 0.7, 0.6, 0.5]
      : mode === "balanced"
        ? [0.85, 0.75, 0.65, 0.55, 0.48, 0.4]
        : [0.9, 0.82, 0.72, 0.62, 0.52, 0.42, 0.32, 0.25];

  let bestBlob: Blob | null = null;

  const scales = [1, 0.9, 0.8, 0.7, 0.6];
  const totalSteps = scales.length * qualitySteps.length * 2;
  let step = 0;

  const reportStep = (label: string) => {
    step += 1;
    const percent = 8 + Math.round((step / totalSteps) * 88);
    onProgress?.({ percent, label });
  };

  onProgress?.({ percent: 5, label: "Loading image…" });

  for (const scale of scales) {
    const scaledWidth = Math.max(1, Math.round(width * scale));
    const scaledHeight = Math.max(1, Math.round(height * scale));
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    context.clearRect(0, 0, scaledWidth, scaledHeight);
    context.drawImage(sourceBitmap, 0, 0, scaledWidth, scaledHeight);

    for (const quality of qualitySteps) {
      reportStep(`Encoding image (scale ${Math.round(scale * 100)}%)…`);
      const webpBlob = await canvasToBlob(canvas, "image/webp", quality);
      if (!bestBlob || webpBlob.size < bestBlob.size) {
        bestBlob = webpBlob;
      }
      if (webpBlob.size <= targetBytes) {
        sourceBitmap.close();
        onProgress?.({ percent: 100, label: "Image compression complete" });
        return {
          blob: webpBlob,
          method: "image-webp-lossy",
          note: "Image re-encoded with quality sweep toward your size target.",
          extension: "webp",
          targetHit: true,
        };
      }

      reportStep(`Encoding JPEG (scale ${Math.round(scale * 100)}%, q ${quality})…`);
      const jpegBlob = await canvasToBlob(canvas, "image/jpeg", quality);
      if (jpegBlob.size < (bestBlob?.size ?? Number.MAX_SAFE_INTEGER)) {
        bestBlob = jpegBlob;
      }
      if (jpegBlob.size <= targetBytes) {
        sourceBitmap.close();
        onProgress?.({ percent: 100, label: "Image compression complete" });
        return {
          blob: jpegBlob,
          method: "image-jpeg-lossy",
          note: "Image re-encoded with quality sweep toward your size target.",
          extension: "jpg",
          targetHit: true,
        };
      }
    }
  }

  sourceBitmap.close();
  if (!bestBlob) {
    throw new Error("Could not compress this image.");
  }

  onProgress?.({ percent: 100, label: "Image compression complete" });

  return {
    blob: bestBlob,
    method: "image-lossy-best-effort",
    note: "Lossy image recompression applied; best achievable size selected.",
    extension: bestBlob.type.includes("jpeg") ? "jpg" : "webp",
    targetHit: bestBlob.size <= targetBytes,
  };
}

export type VideoCompressionProgress = {
  stage: "loading" | "encoding" | "done";
  ratio: number;
};

export function videoProgressToPercent(
  progress: VideoCompressionProgress,
): CompressionProgressUpdate {
  if (progress.stage === "loading") {
    return { percent: 8, label: "Loading video encoder…" };
  }
  if (progress.stage === "encoding") {
    const pct = 10 + Math.round(progress.ratio * 85);
    return {
      percent: Math.min(95, pct),
      label: `Encoding video… ${Math.round(progress.ratio * 100)}%`,
    };
  }
  return { percent: 100, label: "Video encoding complete" };
}

export async function compressVideoInBrowser(
  file: File,
  onProgress?: (progress: VideoCompressionProgress) => void,
): Promise<{ blob: Blob; method: string; note: string }> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

  onProgress?.({ stage: "loading", ratio: 0 });

  const ffmpeg = new FFmpeg();
  ffmpeg.on("progress", ({ progress }) => {
    onProgress?.({ stage: "encoding", ratio: progress });
  });

  const coreVersion = "0.12.6";
  const baseURL = `https://unpkg.com/@ffmpeg/core@${coreVersion}/dist/esm`;
  await ffmpeg.load({
    coreURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      "text/javascript",
    ),
    wasmURL: await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm",
    ),
  });

  const inputName = "input.mp4";
  const outputName = "output.mp4";
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  onProgress?.({ stage: "encoding", ratio: 0 });

  const exitCode = await ffmpeg.exec([
    "-i",
    inputName,
    "-map",
    "0:v:0?",
    "-map",
    "0:a:0?",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "28",
    "-profile:v",
    "high",
    "-level",
    "4.1",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-ac",
    "2",
    "-ar",
    "48000",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputName,
  ]);

  if (exitCode !== 0) {
    throw new Error("Browser video encoding failed.");
  }

  const data = await ffmpeg.readFile(outputName);
  const bytes =
    data instanceof Uint8Array ? data.slice() : new TextEncoder().encode(String(data));

  onProgress?.({ stage: "done", ratio: 1 });

  return {
    blob: new Blob([bytes], { type: "video/mp4" }),
    method: "video-h264-wasm",
    note: "Video re-encoded in your browser for smaller size and broad compatibility.",
  };
}

export function isPdfFile(file: File): boolean {
  if (file.type === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

export function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|mov|mkv|avi|webm|m4v)$/i.test(file.name);
}
