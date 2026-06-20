#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import zlib from "node:zlib";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value =
      argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "true";
    args[key] = value;
    if (value !== "true") i += 1;
  }
  return args;
}

function commandExists(command) {
  const result = spawnSync("bash", ["-lc", `command -v ${command}`], {
    encoding: "utf8",
  });
  return result.status === 0;
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(
      `${command} failed with code ${result.status ?? "unknown"}`,
    );
  }
}

function bytesToHuman(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function statSize(filePath) {
  return fs.statSync(filePath).size;
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function compressVideo(inputPath, outputPath) {
  if (!commandExists("ffmpeg")) {
    throw new Error(
      "ffmpeg is required for video compression. Install with: brew install ffmpeg",
    );
  }
  const dir = path.dirname(outputPath);
  const base = path.basename(outputPath, ".mp4");
  const h264 = path.join(dir, `${base}_h264.mp4`);
  const hevc = path.join(dir, `${base}_hevc.mp4`);
  const encode = (out, codecArgs) => {
    run("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-map",
      "0:v:0?",
      "-map",
      "0:a:0?",
      ...codecArgs,
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
      out,
    ]);
  };
  encode(h264, [
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
  ]);
  encode(hevc, [
    "-c:v",
    "libx265",
    "-tag:v",
    "hvc1",
    "-preset",
    "medium",
    "-crf",
    "30",
    "-pix_fmt",
    "yuv420p",
  ]);
  const pick = [h264, hevc].sort((a, b) => statSize(a) - statSize(b))[0];
  fs.copyFileSync(pick, outputPath);
}

function compressPdf(inputPath, outputPath) {
  if (!commandExists("gs")) {
    throw new Error(
      "ghostscript is required for PDF compression. Install with: brew install ghostscript",
    );
  }
  run("gs", [
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.4",
    "-dPDFSETTINGS=/ebook",
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    `-sOutputFile=${outputPath}`,
    inputPath,
  ]);
}

function compressTextLike(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath);
  const compressed = zlib.brotliCompressSync(input, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  fs.writeFileSync(outputPath, compressed);
}

function compressGeneric(inputPath, outputPath) {
  const input = fs.readFileSync(inputPath);
  const compressed = zlib.gzipSync(input, { level: 9 });
  fs.writeFileSync(outputPath, compressed);
}

function chooseOutputPath(inputPath, explicitOutput) {
  if (explicitOutput) return explicitOutput;
  const ext = path.extname(inputPath).toLowerCase();
  const base = path.basename(inputPath, ext);
  const dir = path.join(path.dirname(inputPath), "compressed-output");

  if ([".mp4", ".mov", ".mkv", ".avi"].includes(ext)) {
    return path.join(dir, `${base}_compressed.mp4`);
  }
  if (ext === ".pdf") {
    return path.join(dir, `${base}_compressed.pdf`);
  }
  if ([".csv", ".txt", ".json", ".xml", ".md", ".log"].includes(ext)) {
    return path.join(dir, `${base}${ext}.br`);
  }
  return path.join(dir, `${base}${ext}.gz`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const input = args.input;
  if (!input) {
    console.error(
      'Usage: npm run compress:local -- --input "/absolute/path/to/file"',
    );
    process.exit(1);
  }

  const inputPath = path.resolve(input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const outputPath = path.resolve(chooseOutputPath(inputPath, args.output));
  ensureParentDirectory(outputPath);

  const ext = path.extname(inputPath).toLowerCase();
  if ([".mp4", ".mov", ".mkv", ".avi"].includes(ext)) {
    compressVideo(inputPath, outputPath);
  } else if (ext === ".pdf") {
    compressPdf(inputPath, outputPath);
  } else if ([".csv", ".txt", ".json", ".xml", ".md", ".log"].includes(ext)) {
    compressTextLike(inputPath, outputPath);
  } else {
    compressGeneric(inputPath, outputPath);
  }

  const original = statSize(inputPath);
  const compressed = statSize(outputPath);
  const savedPercent = ((original - compressed) / original) * 100;

  console.log("");
  console.log(`Input:      ${inputPath}`);
  console.log(`Output:     ${outputPath}`);
  console.log(`Original:   ${bytesToHuman(original)}`);
  console.log(`Compressed: ${bytesToHuman(compressed)}`);
  console.log(
    `Saved:      ${bytesToHuman(original - compressed)} (${savedPercent.toFixed(1)}%)`,
  );
}

main();
