"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { deleteUserFileAction, listUserFilesAction } from "@/app/actions/files";
import { useAuth } from "@/components/auth-provider";
import { PageShell } from "@/components/page-shell";
import { formatBytes } from "@/lib/compression-engine";
import { userFacingMethod } from "@/lib/user-facing-labels";
import type { UserFileRecord } from "@/lib/user-file-types";

function savingsPercent(original: number, compressed: number): string {
  if (original <= 0) return "0";
  return (((original - compressed) / original) * 100).toFixed(1);
}

export function MyFilesPageClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState<UserFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listUserFilesAction();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFiles(result.files);
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace("/login?next=/my-files");
      return;
    }
    void loadFiles();
  }, [user, router, loadFiles]);

  async function handleDelete(fileId: string) {
    setDeletingId(fileId);
    const result = await deleteUserFileAction(fileId);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  if (!user) {
    return (
      <PageShell narrow className="text-center text-gray-400">
        Redirecting to login…
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            My files
          </h1>
          <p className="mt-2 text-gray-400 max-w-xl">
            Compressed files saved to your account are{" "}
            <span className="text-cyan-400/90">encrypted at rest</span> and only
            accessible when you are logged in.
          </p>
        </div>
        <Link
          href="/compress"
          className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-gray-200 transition-colors text-center"
        >
          Compress new file
        </Link>
      </div>

      {loading && (
        <p className="text-gray-500 text-sm">Loading your files…</p>
      )}

      {error && (
        <p className="text-amber-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {!loading && files.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-10 text-center">
          <p className="text-gray-400">No saved files yet.</p>
          <p className="mt-2 text-sm text-gray-500">
            Log in and compress a file — it will appear here automatically.
          </p>
          <Link
            href="/compress"
            className="inline-block mt-6 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
          >
            Go to workbench →
          </Link>
        </div>
      )}

      <ul className="space-y-4">
        {files.map((file) => (
          <li
            key={file.id}
            className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">
                {file.outputName}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                From: {file.originalName}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-gray-300">
                  {formatBytes(file.originalSize)} →{" "}
                  {formatBytes(file.compressedSize)}
                </span>
                <span className="rounded-full bg-emerald-950 border border-emerald-800/50 px-2.5 py-1 text-emerald-400">
                  {savingsPercent(file.originalSize, file.compressedSize)}% saved
                </span>
                <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-gray-400">
                  {userFacingMethod(file.method)}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-gray-600">
                Saved {new Date(file.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <a
                href={`/api/my-files/${file.id}/download`}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200 transition-colors"
              >
                Download
              </a>
              <button
                type="button"
                onClick={() => void handleDelete(file.id)}
                disabled={deletingId === file.id}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
              >
                {deletingId === file.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
