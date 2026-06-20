import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import cors from "cors";
import express from "express";
import multer from "multer";
import { cleanupJobDir, compressUploadedFile } from "./compress.mjs";

const app = express();
const port = Number(process.env.PORT ?? 8080);
const uploadDir = path.join(os.tmpdir(), "click-compress-uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: {
    fileSize: Number(process.env.WORKER_MAX_UPLOAD_MB ?? 100) * 1024 * 1024,
  },
});

const allowedOrigins = (process.env.WORKER_ALLOWED_ORIGINS ??
  "https://clickcompress.com,https://www.clickcompress.com,http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    exposedHeaders: [
      "X-Output-Name",
      "X-Method",
      "X-Note",
      "X-Original-Size",
      "X-Compressed-Size",
    ],
  }),
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    gs: Boolean(spawnOk("gs", ["--version"])),
    ffmpeg: Boolean(spawnOk("ffmpeg", ["-version"])),
  });
});

function spawnOk(cmd, args) {
  try {
    return spawnSync(cmd, args, { encoding: "utf8" }).status === 0;
  } catch {
    return false;
  }
}

app.post("/compress", upload.single("file"), async (req, res) => {
  try {
    const secret = process.env.WORKER_SECRET?.trim();
    if (secret) {
      const auth = req.headers.authorization ?? "";
      if (auth !== `Bearer ${secret}`) {
        res.status(401).json({ ok: false, error: "Unauthorized" });
        return;
      }
    }

    const result = await compressUploadedFile(req.file);
    res.setHeader("X-Output-Name", result.outputName);
    res.setHeader("X-Method", result.method);
    res.setHeader("X-Note", result.note);
    res.setHeader("X-Original-Size", String(result.originalSize));
    res.setHeader("X-Compressed-Size", String(result.compressedSize));
    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.outputName.replace(/"/g, "")}"`,
    );

    const stream = fs.createReadStream(result.outputPath);
    stream.on("error", () => {
      cleanupJobDir(result.tmpRoot);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: "Failed to send compressed file." });
      }
    });
    stream.on("close", () => {
      cleanupJobDir(result.tmpRoot);
    });
    stream.pipe(res);
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Compression failed.",
    });
  }
});

app.use((err, _req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof multer.MulterError) {
    const maxMb = process.env.WORKER_MAX_UPLOAD_MB ?? 100;
    res.status(413).json({
      ok: false,
      error:
        err.code === "LIMIT_FILE_SIZE"
          ? `Upload too large (max ${maxMb} MB on free worker).`
          : err.message,
    });
    return;
  }

  res.status(400).json({
    ok: false,
    error: err instanceof Error ? err.message : "Request failed.",
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Click-Compress worker listening on :${port}`);
});
