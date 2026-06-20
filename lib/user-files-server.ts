import { usePostgres } from "@/lib/env";
import { decryptBuffer, encryptBuffer } from "@/lib/file-crypto";
import {
  deleteUserFileDb,
  getUserFileDb,
  listUserFilesDb,
  readUserFilePlainDb,
  saveUserFileDb,
} from "@/lib/user-files/db-store";
import {
  deleteUserFileLocal,
  getUserFileLocal,
  listUserFilesLocal,
  readUserFilePlainLocal,
  saveUserFileLocal,
} from "@/lib/user-files/local-store";

export type { UserFileRecord } from "@/lib/user-file-types";
export { decryptBuffer, encryptBuffer };

export async function saveUserFile(input: {
  userId: string;
  plainBuffer: Buffer;
  originalName: string;
  outputName: string;
  originalSize: number;
  compressedSize: number;
  method: string;
  note?: string;
  mimeType?: string;
}) {
  if (usePostgres()) {
    return saveUserFileDb(input);
  }
  return saveUserFileLocal(input);
}

export async function listUserFiles(userId: string) {
  if (usePostgres()) {
    return listUserFilesDb(userId);
  }
  return listUserFilesLocal(userId);
}

export async function getUserFile(userId: string, fileId: string) {
  if (usePostgres()) {
    const record = await getUserFileDb(userId, fileId);
    if (!record) return null;
    const { storageKey: _storageKey, ...publicRecord } = record;
    return publicRecord;
  }
  return getUserFileLocal(userId, fileId);
}

export async function readUserFilePlain(userId: string, fileId: string) {
  if (usePostgres()) {
    return readUserFilePlainDb(userId, fileId);
  }
  return readUserFilePlainLocal(userId, fileId);
}

export async function deleteUserFile(userId: string, fileId: string) {
  if (usePostgres()) {
    return deleteUserFileDb(userId, fileId);
  }
  return deleteUserFileLocal(userId, fileId);
}
