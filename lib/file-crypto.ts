import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";
import { fileEncryptionSecret } from "@/lib/env";

function deriveUserKey(userId: string): Buffer {
  return scryptSync(
    fileEncryptionSecret(),
    `click-compress-files:${userId}`,
    32,
  );
}

export function encryptBuffer(userId: string, plain: Buffer): Buffer {
  const key = deriveUserKey(userId);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

export function decryptBuffer(userId: string, payload: Buffer): Buffer {
  const key = deriveUserKey(userId);
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const data = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}
