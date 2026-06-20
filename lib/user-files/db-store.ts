import path from "node:path";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { userFiles } from "@/lib/db/schema";
import { decryptBuffer, encryptBuffer } from "@/lib/file-crypto";
import {
  blobStorageKey,
  deleteBlob,
  getBlob,
  putBlob,
} from "@/lib/storage/blob-store";
import type { UserFileRecord } from "@/lib/user-file-types";

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

function rowToRecord(row: typeof userFiles.$inferSelect): UserFileRecord {
  return {
    id: row.id,
    userId: row.userId,
    originalName: row.originalName,
    outputName: row.outputName,
    originalSize: row.originalSize,
    compressedSize: row.compressedSize,
    method: row.method,
    note: row.note ?? undefined,
    mimeType: row.mimeType,
    createdAt: row.createdAt,
  };
}

export async function saveUserFileDb(input: {
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
  const mimeType = input.mimeType ?? guessMimeType(input.outputName);
  const inserted = await getDb()
    .insert(userFiles)
    .values({
      userId: input.userId,
      originalName: input.originalName,
      outputName: input.outputName,
      originalSize: input.originalSize,
      compressedSize: input.compressedSize,
      method: input.method,
      note: input.note,
      mimeType,
      storageKey: "pending",
    })
    .returning();

  const row = inserted[0];
  const storageKey = blobStorageKey(input.userId, row.id);
  const encrypted = encryptBuffer(input.userId, input.plainBuffer);
  await putBlob(storageKey, encrypted);

  const updated = await getDb()
    .update(userFiles)
    .set({ storageKey })
    .where(eq(userFiles.id, row.id))
    .returning();

  return rowToRecord(updated[0]);
}

export async function listUserFilesDb(
  userId: string,
): Promise<UserFileRecord[]> {
  const rows = await getDb()
    .select()
    .from(userFiles)
    .where(eq(userFiles.userId, userId))
    .orderBy(desc(userFiles.createdAt));
  return rows.map(rowToRecord);
}

export async function getUserFileDb(
  userId: string,
  fileId: string,
): Promise<(UserFileRecord & { storageKey: string }) | null> {
  const rows = await getDb()
    .select()
    .from(userFiles)
    .where(and(eq(userFiles.userId, userId), eq(userFiles.id, fileId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { ...rowToRecord(row), storageKey: row.storageKey };
}

export async function readUserFilePlainDb(
  userId: string,
  fileId: string,
): Promise<Buffer> {
  const record = await getUserFileDb(userId, fileId);
  if (!record) throw new Error("File not found.");
  const enc = await getBlob(record.storageKey);
  return decryptBuffer(userId, enc);
}

export async function deleteUserFileDb(
  userId: string,
  fileId: string,
): Promise<boolean> {
  const record = await getUserFileDb(userId, fileId);
  if (!record) return false;

  await getDb()
    .delete(userFiles)
    .where(and(eq(userFiles.userId, userId), eq(userFiles.id, fileId)));

  try {
    await deleteBlob(record.storageKey);
  } catch {
    /* metadata removed; orphan blob is acceptable on delete failure */
  }
  return true;
}
