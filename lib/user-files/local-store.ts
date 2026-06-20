import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { decryptBuffer, encryptBuffer } from "@/lib/file-crypto";
import type { UserFileRecord } from "@/lib/user-file-types";

export type { UserFileRecord } from "@/lib/user-file-types";

const FILES_ROOT = path.join(process.cwd(), ".data", "files");

type UserFileIndex = {
  files: UserFileRecord[];
};

function userDir(userId: string): string {
  return path.join(FILES_ROOT, userId);
}

function indexPath(userId: string): string {
  return path.join(userDir(userId), "index.json");
}

function encPath(userId: string, fileId: string): string {
  return path.join(userDir(userId), `${fileId}.enc`);
}

function guessMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const map: Record<string, string> = {
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".br": "application/octet-stream",
    ".gz": "application/gzip",
    ".json": "application/json",
    ".txt": "text/plain",
  };
  return map[ext] ?? "application/octet-stream";
}

function readIndex(userId: string): UserFileIndex {
  const p = indexPath(userId);
  if (!fs.existsSync(p)) return { files: [] };
  return JSON.parse(fs.readFileSync(p, "utf8")) as UserFileIndex;
}

function writeIndex(userId: string, index: UserFileIndex): void {
  fs.mkdirSync(userDir(userId), { recursive: true });
  fs.writeFileSync(indexPath(userId), JSON.stringify(index, null, 2), "utf8");
}

export async function saveUserFileLocal(input: {
  userId: string;
  plainBuffer: Buffer;
  originalName: string;
  outputName: string;
  originalSize: number;
  compressedSize: number;
  method: string;
  note?: string;
  mimeType?: string;
}): Promise<UserFileRecord> {
  const id = randomUUID();
  const record: UserFileRecord = {
    id,
    userId: input.userId,
    originalName: input.originalName,
    outputName: input.outputName,
    originalSize: input.originalSize,
    compressedSize: input.compressedSize,
    method: input.method,
    note: input.note,
    mimeType: input.mimeType ?? guessMimeType(input.outputName),
    createdAt: new Date().toISOString(),
  };

  fs.mkdirSync(userDir(input.userId), { recursive: true });
  fs.writeFileSync(
    encPath(input.userId, id),
    encryptBuffer(input.userId, input.plainBuffer),
  );

  const index = readIndex(input.userId);
  index.files.unshift(record);
  writeIndex(input.userId, index);

  return record;
}

export async function listUserFilesLocal(
  userId: string,
): Promise<UserFileRecord[]> {
  return readIndex(userId).files.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getUserFileLocal(
  userId: string,
  fileId: string,
): Promise<UserFileRecord | null> {
  return readIndex(userId).files.find((f) => f.id === fileId) ?? null;
}

export async function readUserFilePlainLocal(
  userId: string,
  fileId: string,
): Promise<Buffer> {
  const record = await getUserFileLocal(userId, fileId);
  if (!record) throw new Error("File not found.");
  const enc = fs.readFileSync(encPath(userId, fileId));
  return decryptBuffer(userId, enc);
}

export async function deleteUserFileLocal(
  userId: string,
  fileId: string,
): Promise<boolean> {
  const index = readIndex(userId);
  const idx = index.files.findIndex((f) => f.id === fileId);
  if (idx === -1) return false;

  index.files.splice(idx, 1);
  writeIndex(userId, index);

  const p = encPath(userId, fileId);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  return true;
}
