"use server";

import { getSessionUser } from "@/lib/auth-server";
import {
  deleteUserFile,
  getUserFile,
  listUserFiles,
  readUserFilePlain,
  saveUserFile,
} from "@/lib/user-files-server";
import type { UserFileRecord } from "@/lib/user-file-types";

export type UserFilesListResponse =
  | { ok: true; files: UserFileRecord[] }
  | { ok: false; error: string };

export type SaveUserFileResponse =
  | { ok: true; file: UserFileRecord; downloadPath: string }
  | { ok: false; error: string };

export type DeleteUserFileResponse =
  | { ok: true }
  | { ok: false; error: string };

export async function listUserFilesAction(): Promise<UserFilesListResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Please log in to view your files." };
  }
  return { ok: true, files: await listUserFiles(user.id) };
}

export async function saveUserFileAction(
  formData: FormData,
): Promise<SaveUserFileResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Please log in to save files." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided." };
  }

  const originalName = String(formData.get("originalName") ?? file.name);
  const outputName = String(formData.get("outputName") ?? file.name);
  const originalSize = Number(formData.get("originalSize") ?? file.size);
  const compressedSize = Number(formData.get("compressedSize") ?? file.size);
  const method = String(formData.get("method") ?? "compressed");
  const note = String(formData.get("note") ?? "");

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const record = await saveUserFile({
      userId: user.id,
      plainBuffer: buffer,
      originalName,
      outputName,
      originalSize,
      compressedSize,
      method,
      note: note || undefined,
    });

    return {
      ok: true,
      file: record,
      downloadPath: `/api/my-files/${record.id}/download`,
    };
  } catch {
    return { ok: false, error: "Could not save your file securely." };
  }
}

export async function deleteUserFileAction(
  fileId: string,
): Promise<DeleteUserFileResponse> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Please log in." };
  }
  if (!(await deleteUserFile(user.id, fileId))) {
    return { ok: false, error: "File not found." };
  }
  return { ok: true };
}

export async function getUserFileForDownload(
  fileId: string,
): Promise<
  | { ok: true; buffer: Buffer; fileName: string; mimeType: string }
  | { ok: false; error: string }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  const record = await getUserFile(user.id, fileId);
  if (!record) {
    return { ok: false, error: "Not found" };
  }

  try {
    const buffer = await readUserFilePlain(user.id, fileId);
    return {
      ok: true,
      buffer,
      fileName: record.outputName,
      mimeType: record.mimeType,
    };
  } catch {
    return { ok: false, error: "Could not decrypt file." };
  }
}
