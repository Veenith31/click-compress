import { spawnSync } from "node:child_process";
import cors from "cors";
import express from "express";
import multer from "multer";
import { compressUploadedFile } from "./compress.mjs";

const app = express();
const port = Number(process.env.PORT ?? 8080);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.WORKER_MAX_UPLOAD_MB ?? 100) * 1024 * 1024 },
});

const allowedOrigins = (process.env.WORKER_ALLOWED_ORIGINS ??
  "https://clickcompress.com,https://www.clickcompress.com,http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed"));
    },
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
    res.send(result.buffer);
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Compression failed.",
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Click-Compress worker listening on :${port}`);
});
