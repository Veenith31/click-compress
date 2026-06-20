import os from "node:os";
import path from "node:path";
import { CLOUD_MAX_UPLOAD_BYTES } from "@/lib/upload-limits";
import { resolveBinary } from "@/lib/resolve-binary";

/** True on Vercel serverless (read-only project dir; use /tmp). */
export function isVercelServerless(): boolean {
  return process.env.VERCEL === "1";
}

/** Writable temp directory for compression jobs. */
export function serverTempRoot(): string {
  if (isVercelServerless()) {
    return path.join(os.tmpdir(), "click-compress");
  }
  return path.join(process.cwd(), ".tmp-compress");
}

/** Max upload size for server actions on this host. */
export function serverMaxUploadBytes(): number {
  if (isVercelServerless()) {
    return CLOUD_MAX_UPLOAD_BYTES;
  }
  return 100 * 1024 * 1024;
}

export function hasNativePdfTools(): boolean {
  return resolveBinary("gs") !== null;
}

export function hasNativeVideoTools(): boolean {
  return resolveBinary("ffmpeg") !== null;
}

export function serverOutputRoot(): string {
  if (isVercelServerless()) {
    return path.join(os.tmpdir(), "click-compress-out");
  }
  return path.join(process.cwd(), "public", "generated");
}
