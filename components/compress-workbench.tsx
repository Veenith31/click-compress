"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/components/auth-provider";
import { compressNativeAction } from "@/app/actions";
import { saveUserFileAction } from "@/app/actions/files";
import { getCompressionAiStatusAction } from "@/app/actions/ai";
import {
  userFacingAiNote,
  userFacingMethod,
} from "@/lib/user-facing-labels";
import {
  checkCompressionWorkerHealth,
  compressViaWorker,
  useDirectCompressionWorker,
} from "@/lib/compression-worker-client";
import {
  CLOUD_MAX_UPLOAD_BYTES,
  isProductionHost,
} from "@/lib/upload-limits";
import {
  bestLosslessCompression,
  compressImageTowardTarget,
  compressVideoInBrowser,
  formatBytes,
  isAudioFile,
  isPdfFile,
  isVideoFile,
  isWorkerMediaFile,
  targetBytesFor,
  TARGET_SAVINGS_RATIO,
  videoProgressToPercent,
  type CompressionGoal,
  type CompressionMode,
  type OptimizationProfile,
  type VideoCompressionProgress,
} from "@/lib/compression-engine";

type CompressionResult = {
  originalSize: number;
  compressedSize: number;
  savedSize: number;
  savedPercent: number;
  method: string;
  note: string;
  aiNote?: string;
  savedToAccount?: boolean;
  outputName: string;
  blob: Blob | null;
  profile: OptimizationProfile;
  goal: CompressionGoal;
  targetHit: boolean;
};

function outputNameFrom(fileName: string, extension: string): string {
  const base = fileName.replace(/\.[^/.]+$/, "") || fileName;
  if (extension === "original") return fileName;
  return `${base}.${extension}`;
}

function CompressionProgressBar({
  percent,
  label,
}: {
  percent: number;
  label: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span className="font-mono text-white tabular-nums">{clamped}%</span>
      </div>
      <div
        className="h-2 bg-zinc-800 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-[width] duration-300 ease-out rounded-full"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export function CompressWorkbench() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<CompressionMode>("max");
  const [profile, setProfile] = useState<OptimizationProfile>("smart");
  const [goal, setGoal] = useState<CompressionGoal>("target-40");
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressNote, setProgressNote] = useState<string | null>(null);
  const [smartAi, setSmartAi] = useState(true);
  const [aiStatus, setAiStatus] = useState<{ configured: boolean } | null>(
    null,
  );
  const lastUrlRef = useRef<string | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const acceptHint = useMemo(() => {
    if (useDirectCompressionWorker()) {
      return ".pdf,.mp4,.mov,.mkv,.avi,.webm,.m4v,.wav,.mp3,.flac,.ogg,.m4a,video/*,audio/*";
    }
    if (profile === "media") return "video/*,audio/*,image/*";
    if (profile === "text") return ".txt,.csv,.json,.xml,.md,.log";
    return "";
  }, [profile]);

  useEffect(() => {
    getCompressionAiStatusAction().then(setAiStatus);
  }, []);

  useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  function setProgress(percent: number, label: string) {
    setProgressPercent(percent);
    setProgressNote(label);
  }

  function startServerProgressTimer() {
    let pct = 12;
    setProgress(pct, "Uploading and processing on server…");
    progressTimerRef.current = setInterval(() => {
      pct = Math.min(pct + 3, 92);
      setProgress(pct, `Processing on server… ${pct}%`);
    }, 450);
  }

  function stopServerProgressTimer() {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }

  async function saveToMyFilesIfLoggedIn(input: {
    blob: Blob;
    originalFile: File;
    outputName: string;
    compressedSize: number;
    method: string;
    note: string;
  }): Promise<{ downloadUrl: string; note: string; savedToAccount: boolean }> {
    if (!user) {
      const url = URL.createObjectURL(input.blob);
      return { downloadUrl: url, note: input.note, savedToAccount: false };
    }

    if (input.blob.size > CLOUD_MAX_UPLOAD_BYTES) {
      const url = URL.createObjectURL(input.blob);
      return {
        downloadUrl: url,
        note: `${input.note} Download locally — files over 4 MB cannot be saved to My Files on cloud hosting.`,
        savedToAccount: false,
      };
    }

    setProgress(98, "Encrypting and saving to your account…");
    const fd = new FormData();
    fd.append(
      "file",
      new File([input.blob], input.outputName, {
        type: input.blob.type || "application/octet-stream",
      }),
    );
    fd.append("originalName", input.originalFile.name);
    fd.append("outputName", input.outputName);
    fd.append("originalSize", String(input.originalFile.size));
    fd.append("compressedSize", String(input.compressedSize));
    fd.append("method", input.method);
    fd.append("note", input.note);

    try {
      const saved = await saveUserFileAction(fd);
      if (!saved.ok) {
        const url = URL.createObjectURL(input.blob);
        return {
          downloadUrl: url,
          note: `${input.note} (Could not save to account — download locally.)`,
          savedToAccount: false,
        };
      }

      return {
        downloadUrl: saved.downloadPath,
        note: `${input.note} Saved securely to My Files (encrypted at rest).`,
        savedToAccount: true,
      };
    } catch {
      const url = URL.createObjectURL(input.blob);
      return {
        downloadUrl: url,
        note: `${input.note} Download locally — cloud save failed (file may exceed server limit).`,
        savedToAccount: false,
      };
    }
  }

  function workerProgressLabel(file: File): string {
    if (isPdfFile(file)) return "Compressing on GCP worker (Ghostscript)…";
    if (isVideoFile(file)) return "Compressing on GCP worker (FFmpeg video)…";
    if (isAudioFile(file)) return "Compressing on GCP worker (FFmpeg audio)…";
    return "Compressing on GCP worker…";
  }

  function shouldUseCompressionWorker(): boolean {
    if (!file || !useDirectCompressionWorker()) return false;
    return isWorkerMediaFile(file);
  }

  function usesNativeServerPipeline(): boolean {
    if (!file) return false;
    if (shouldUseCompressionWorker()) return true;
    if (isProductionHost()) {
      if (isPdfFile(file)) return false;
      if (file.size > CLOUD_MAX_UPLOAD_BYTES) return false;
    }
    if (goal === "high-impact-local") return true;
    if (goal === "strict-lossless") return false;
    return isPdfFile(file);
  }

  async function runNativeCompression(): Promise<void> {
    if (!file) return;

    if (lastUrlRef.current) {
      URL.revokeObjectURL(lastUrlRef.current);
      lastUrlRef.current = null;
    }

    const nativeFd = new FormData();
    nativeFd.append("file", file);
    nativeFd.append("mode", mode);
    if (isPdfFile(file) && goal !== "strict-lossless") {
      nativeFd.append("pdfLossy", "true");
    }
    nativeFd.append("useAi", smartAi ? "true" : "false");

    if (isPdfFile(file)) {
      setProgress(
        10,
        shouldUseCompressionWorker()
          ? "Preparing PDF upload to GCP worker…"
          : smartAi && aiStatus?.configured
            ? "Smart routing + PDF optimization…"
            : "Optimizing PDF…",
      );
    } else if (shouldUseCompressionWorker() && isVideoFile(file)) {
      setProgress(10, "Preparing video upload to GCP worker…");
    } else if (shouldUseCompressionWorker() && isAudioFile(file)) {
      setProgress(10, "Preparing audio upload to GCP worker…");
    }

    if (shouldUseCompressionWorker()) {
      const workerMaxBytes = 25 * 1024 * 1024;
      if (file.size > workerMaxBytes) {
        throw new Error(
          `File is ${formatBytes(file.size)} — worker limit is 25 MB. Try a smaller PDF/video or use Target 40% mode for images.`,
        );
      }

      setProgress(5, "Connecting to GCP compression worker…");

      const workerReady = await checkCompressionWorkerHealth();
      if (!workerReady) {
        throw new Error(
          "Could not reach compression.clickcompress.com. Open https://compression.clickcompress.com/health in your browser — if it loads, retry compress. If not, DNS may still be updating (can take up to 24h on some networks).",
        );
      }

      const processLabel = workerProgressLabel(file);

      const workerResult = await compressViaWorker(nativeFd, (update) => {
        if (update.phase === "process") {
          setProgress(update.percent, processLabel);
          return;
        }
        setProgress(update.percent, update.label);
      });

      if (!workerResult.ok) {
        throw new Error(workerResult.error);
      }

      setProgress(100, "Complete");
      const savedSizeWorker =
        workerResult.originalSize - workerResult.compressedSize;
      const savedPercentWorker =
        workerResult.originalSize > 0
          ? (savedSizeWorker / workerResult.originalSize) * 100
          : 0;

      const persisted = await saveToMyFilesIfLoggedIn({
        blob: workerResult.blob,
        originalFile: file,
        outputName: workerResult.outputName,
        compressedSize: workerResult.compressedSize,
        method: workerResult.method,
        note: workerResult.note,
      });
      if (!persisted.savedToAccount) {
        lastUrlRef.current = persisted.downloadUrl;
      }
      setDownloadUrl(persisted.downloadUrl);
      setResult({
        originalSize: workerResult.originalSize,
        compressedSize: workerResult.compressedSize,
        savedSize: savedSizeWorker,
        savedPercent: savedPercentWorker,
        method: userFacingMethod(workerResult.method),
        note: persisted.note,
        outputName: workerResult.outputName,
        blob: workerResult.blob,
        profile,
        goal,
        targetHit:
          workerResult.compressedSize <=
          targetBytesFor(workerResult.originalSize),
        savedToAccount: persisted.savedToAccount,
      });
      return;
    }

    startServerProgressTimer();

    let nativeResult;
    try {
      nativeResult = await compressNativeAction(nativeFd);
    } catch {
      throw new Error(
        "Cloud server compression failed (file may exceed the 4 MB upload limit). Switch to Target 40% mode or use a smaller file.",
      );
    }
    stopServerProgressTimer();

    if (!nativeResult.ok) {
      const videoProcessorMissing =
        nativeResult.error.includes("Video processing is unavailable");
      if (videoProcessorMissing && isVideoFile(file)) {
        setProgress(5, "Switching to in-browser video encoder…");
        const wasmResult = await compressVideoInBrowser(
          file,
          (p: VideoCompressionProgress) => {
            const update = videoProgressToPercent(p);
            setProgress(update.percent, update.label);
          },
        );
        setProgress(100, "Complete");
        const savedSize = file.size - wasmResult.blob.size;
        const savedPercent = (savedSize / file.size) * 100;
        const outputName = `${file.name.replace(/\.[^/.]+$/, "")}_compressed.mp4`;
        const persisted = await saveToMyFilesIfLoggedIn({
          blob: wasmResult.blob,
          originalFile: file,
          outputName,
          compressedSize: wasmResult.blob.size,
          method: wasmResult.method,
          note: wasmResult.note,
        });
        if (!persisted.savedToAccount) {
          lastUrlRef.current = persisted.downloadUrl;
        }
        setDownloadUrl(persisted.downloadUrl);
        setResult({
          originalSize: file.size,
          compressedSize: wasmResult.blob.size,
          savedSize,
          savedPercent,
          method: userFacingMethod(wasmResult.method),
          note: persisted.note,
          outputName,
          blob: wasmResult.blob,
          profile,
          goal,
          targetHit: wasmResult.blob.size <= targetBytesFor(file.size),
          savedToAccount: persisted.savedToAccount,
        });
        return;
      }
      throw new Error(nativeResult.error);
    }

    setProgress(100, "Complete");
    const savedSizeNative =
      nativeResult.originalSize - nativeResult.compressedSize;
    const savedPercentNative =
      (savedSizeNative / nativeResult.originalSize) * 100;

    setDownloadUrl(nativeResult.downloadUrl);
    setResult({
      originalSize: nativeResult.originalSize,
      compressedSize: nativeResult.compressedSize,
      savedSize: savedSizeNative,
      savedPercent: savedPercentNative,
      method: userFacingMethod(nativeResult.method),
      note: nativeResult.note,
      aiNote: userFacingAiNote(nativeResult.aiNote),
      outputName: nativeResult.outputName,
      blob: null,
      profile,
      goal,
      targetHit:
        nativeResult.compressedSize <=
        targetBytesFor(nativeResult.originalSize),
      savedToAccount: nativeResult.savedToAccount,
    });
  }

  async function handleCompress() {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }

    setError(null);
    setResult(null);
    setProgress(0, "Starting…");
    setIsCompressing(true);

    try {
      if (usesNativeServerPipeline()) {
        await runNativeCompression();
        return;
      }

      setProgress(3, "Reading file…");
      const fileData = new Uint8Array(await file.arrayBuffer());
      setProgress(8, "Running compression…");

      const candidate = await bestLosslessCompression(
        fileData,
        mode,
        profile,
        file.type,
        (update) => setProgress(update.percent, update.label),
      );
      const targetBytes = targetBytesFor(file.size);

      let blob: Blob;
      let method = candidate.method;
      let note = candidate.note;
      let extension = candidate.extension;
      let outputName = outputNameFrom(file.name, extension);
      let finalCompressedSize = candidate.data.length;
      let targetHit = false;

      if (goal === "strict-lossless") {
        setProgress(96, "Packaging download…");
        blob = new Blob([candidate.data.slice()], {
          type: "application/octet-stream",
        });
        targetHit = finalCompressedSize <= targetBytes;
        if (candidate.method === "store-copy") outputName = file.name;
      } else if (file.type.startsWith("image/")) {
        const lossyAttempt = await compressImageTowardTarget(
          file,
          targetBytes,
          mode,
          (update) => setProgress(update.percent, update.label),
        );
        blob = lossyAttempt.blob;
        method = lossyAttempt.method;
        note = lossyAttempt.note;
        extension = lossyAttempt.extension;
        outputName = outputNameFrom(file.name, extension);
        finalCompressedSize = blob.size;
        targetHit = lossyAttempt.targetHit;
      } else {
        setProgress(96, "Packaging download…");
        blob = new Blob([candidate.data.slice()], {
          type: "application/octet-stream",
        });
        targetHit = candidate.data.length <= targetBytes;
        method = userFacingMethod(method);
        note =
          isProductionHost() && isPdfFile(file)
            ? "Browser lossless compression on cloud (PDF Ghostscript runs locally on your Mac with npm run dev)."
            : "Browser-only lossless path used. For video or PDF on your Mac, switch to High impact local mode.";
        if (candidate.method === "store-copy") outputName = file.name;
      }

      setProgress(100, "Complete");
      const savedSize = file.size - finalCompressedSize;
      const savedPercent = (savedSize / file.size) * 100;

      const persisted = await saveToMyFilesIfLoggedIn({
        blob,
        originalFile: file,
        outputName,
        compressedSize: finalCompressedSize,
        method,
        note,
      });

      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      if (!persisted.savedToAccount) {
        lastUrlRef.current = persisted.downloadUrl;
      } else {
        lastUrlRef.current = null;
      }
      setDownloadUrl(persisted.downloadUrl);

      setResult({
        originalSize: file.size,
        compressedSize: finalCompressedSize,
        savedSize,
        savedPercent,
        method: userFacingMethod(method),
        note: persisted.note,
        outputName,
        blob,
        profile,
        goal,
        targetHit,
        savedToAccount: persisted.savedToAccount,
      });
    } catch (compressionError) {
      setError(
        compressionError instanceof Error
          ? compressionError.message
          : "Compression failed. Please try another file.",
      );
    } finally {
      stopServerProgressTimer();
      setIsCompressing(false);
    }
  }

  return (
    <PageShell narrow className="flex flex-col items-center">
      <div className="mb-8 text-center w-full">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Compression workbench
        </h1>
        <p className="text-gray-400 mt-2 text-sm sm:text-base">
          Target {TARGET_SAVINGS_RATIO * 100}% savings with format-aware
          re-encoding
        </p>
        {user && (
          <p className="text-xs text-gray-500 mt-2">
            Signed in as{" "}
            <span className="text-gray-300">{user.name}</span> ({user.email}) —{" "}
            compressed files are{" "}
            <Link href="/my-files" className="text-cyan-400 hover:text-cyan-300">
              saved to My files
            </Link>
            .
          </p>
        )}
      </div>

      <div className="w-full border border-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 bg-zinc-900/50 backdrop-blur-xl shadow-2xl space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Choose file
          </label>
          <input
            type="file"
            accept={acceptHint}
            disabled={isCompressing}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1 file:text-black"
          />
          {file && (
            <p className="mt-2 text-xs text-gray-500">
              Selected: {file.name} ({formatBytes(file.size)})
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Compression goal
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value as CompressionGoal)}
            className="w-full rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm"
          >
            <option value="target-40">
              Target 40% savings (recommended — lossy when needed)
            </option>
            <option value="high-impact-local">
              High impact local (best for video & PDF)
            </option>
            <option value="strict-lossless">
              Strict lossless (exact byte restore)
            </option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as CompressionMode)}
              className="w-full rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="fast">Fast</option>
              <option value="balanced">Balanced</option>
              <option value="max">Maximum</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profile
            </label>
            <select
              value={profile}
              onChange={(e) =>
                setProfile(e.target.value as OptimizationProfile)
              }
              className="w-full rounded-xl border border-gray-700 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="smart">Smart</option>
              <option value="text">Text focused</option>
              <option value="media">Media focused</option>
            </select>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-gray-700 bg-black/30 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={smartAi}
            onChange={(e) => setSmartAi(e.target.checked)}
            disabled={isCompressing || !aiStatus?.configured}
            className="mt-0.5 rounded border-gray-600"
          />
          <span className="text-sm">
            <span className="font-medium text-gray-200 block">
              Smart AI routing
            </span>
            <span className="text-gray-500 text-xs mt-1 block">
              {aiStatus?.configured
                ? "Smart routing picks the strongest compression profile for your file before processing runs."
                : "Smart routing is not enabled on this deployment."}
            </span>
          </span>
        </label>

        {goal === "target-40" && (
          <p className="text-xs text-cyan-400/90 rounded-lg border border-cyan-900/50 bg-cyan-950/20 p-3">
            Images and PDFs use smart re-encoding toward your size target.
            Video works best in High impact local mode.
          </p>
        )}
        {file && isPdfFile(file) && goal === "target-40" && (
          <p className="text-xs text-amber-400/90 rounded-lg border border-amber-900/50 bg-amber-950/20 p-3">
            PDF optimization mode: downsamples embedded images and re-encodes
            content. Text-only PDFs may save less.
          </p>
        )}
        {goal === "high-impact-local" && (
          <p className="text-xs text-purple-400/90 rounded-lg border border-purple-900/50 bg-purple-950/20 p-3">
            Uses the high-impact local path. Video outputs stay compatible with
            common players. Large files may take a few minutes.
            {useDirectCompressionWorker() && (
              <span className="block mt-2 text-amber-400/90">
                GCP worker (always on): PDF, MP4/MOV video, WAV/MP3 audio — max
                25 MB per file. Progress shows upload → compress → download.
              </span>
            )}
            {file && isPdfFile(file) && isProductionHost() && (
              <span className="block mt-2 text-amber-400/90">
                {useDirectCompressionWorker()
                  ? "PDF uses high-compression Ghostscript (/screen) on GCP."
                  : "PDF Ghostscript runs on your Mac only — on clickcompress.com we use browser lossless compression instead."}
              </span>
            )}
          </p>
        )}

        <button
          type="button"
          onClick={handleCompress}
          disabled={isCompressing || !file}
          className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompressing ? "Compressing…" : "Compress"}
        </button>

        {isCompressing && (
          <CompressionProgressBar
            percent={progressPercent}
            label={progressNote ?? "Compressing…"}
          />
        )}

        {error && (
          <p className="text-sm text-red-400 text-center" role="alert">
            {error}
          </p>
        )}

        {result && (
          <div className="p-6 border border-white/10 rounded-2xl bg-black/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs uppercase font-bold">
                  Method
                </p>
                <p className="text-lg">{result.method}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-emerald-400 text-xs uppercase font-bold">
                  Saved
                </p>
                <p className="text-3xl font-bold">
                  {result.savedPercent > 0
                    ? `${result.savedPercent.toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-zinc-800 text-gray-300">
                {formatBytes(result.originalSize)} →{" "}
                {formatBytes(result.compressedSize)}
              </span>
              <span
                className={`px-2 py-1 rounded-full border ${
                  result.targetHit
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : "bg-amber-950 text-amber-400 border-amber-800"
                }`}
              >
                {result.targetHit
                  ? `Target hit (≥${TARGET_SAVINGS_RATIO * 100}% saved)`
                  : "Best effort (below target)"}
              </span>
            </div>

            <p className="mt-4 text-sm text-gray-400">{result.note}</p>
            {result.aiNote && (
              <p className="mt-2 text-xs text-violet-400/90 rounded-lg border border-violet-900/40 bg-violet-950/20 p-3">
                {result.aiNote}
              </p>
            )}

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={result.savedToAccount ? undefined : result.outputName}
                className="mt-6 block w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors text-center"
              >
                Download {result.outputName}
              </a>
            )}
            {result.savedToAccount && (
              <Link
                href="/my-files"
                className="mt-3 block w-full py-3 border border-white/15 text-gray-200 font-semibold rounded-xl hover:bg-white/5 transition-colors text-center text-sm"
              >
                View in My files
              </Link>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
