/** Public URL of self-hosted compression worker (browser uploads directly). */
export function compressionWorkerUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_COMPRESSION_WORKER_URL?.trim();
  return url ? url.replace(/\/$/, "") : null;
}

export function useDirectCompressionWorker(): boolean {
  return Boolean(compressionWorkerUrl());
}

export type WorkerCompressResult =
  | {
      ok: true;
      blob: Blob;
      outputName: string;
      method: string;
      note: string;
      originalSize: number;
      compressedSize: number;
    }
  | { ok: false; error: string };

export type WorkerProgressUpdate = {
  phase: "connect" | "upload" | "process" | "download" | "complete";
  percent: number;
  label: string;
};

function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function fetchErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "Compression timed out. Try a smaller file or retry.";
  }
  if (error instanceof TypeError) {
    return (
      "Could not reach compression.clickcompress.com. DNS may still be updating on your network — " +
      "open https://compression.clickcompress.com/health in your browser to verify, then retry."
    );
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Could not reach the compression worker.";
}

function parseWorkerSuccess(
  xhr: XMLHttpRequest,
): WorkerCompressResult | { ok: false; error: string } {
  if (xhr.status < 200 || xhr.status >= 300) {
    let message = `Worker error (${xhr.status})`;
    try {
      const json = JSON.parse(xhr.responseText) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* binary error body */
    }
    return { ok: false, error: message };
  }

  const blob = xhr.response as Blob;
  const outputName = xhr.getResponseHeader("X-Output-Name") ?? "compressed.bin";
  const method = xhr.getResponseHeader("X-Method") ?? "compressed";
  const note = xhr.getResponseHeader("X-Note") ?? "Compressed on worker.";
  const originalSize = Number(xhr.getResponseHeader("X-Original-Size") ?? 0);
  const compressedSize = Number(
    xhr.getResponseHeader("X-Compressed-Size") ?? blob.size,
  );

  return {
    ok: true,
    blob,
    outputName,
    method,
    note,
    originalSize: originalSize || blob.size,
    compressedSize: compressedSize || blob.size,
  };
}

/** Quick health ping — GCP worker is always on. */
export async function checkCompressionWorkerHealth(): Promise<boolean> {
  const base = compressionWorkerUrl();
  if (!base) return false;

  try {
    const response = await fetch(`${base}/health`, {
      cache: "no-store",
      signal: timeoutSignal(20_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function compressViaWorker(
  formData: FormData,
  onProgress?: (update: WorkerProgressUpdate) => void,
): Promise<WorkerCompressResult> {
  const base = compressionWorkerUrl();
  if (!base) {
    return Promise.resolve({
      ok: false,
      error: "Compression worker URL is not configured.",
    });
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/compress`);
    xhr.responseType = "blob";
    xhr.timeout = 600_000;

    let processPct = 48;
    let processTimer: ReturnType<typeof setInterval> | null = null;

    function stopProcessTimer() {
      if (processTimer) {
        clearInterval(processTimer);
        processTimer = null;
      }
    }

    function startProcessTimer(label: string) {
      stopProcessTimer();
      processTimer = setInterval(() => {
        processPct = Math.min(processPct + 1, 92);
        onProgress?.({
          phase: "process",
          percent: processPct,
          label,
        });
      }, 1200);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const uploadRatio = event.loaded / event.total;
      const pct = 8 + Math.round(uploadRatio * 38);
      onProgress?.({
        phase: "upload",
        percent: pct,
        label: `Uploading to GCP worker… ${Math.round(uploadRatio * 100)}%`,
      });
    };

    xhr.upload.onloadend = () => {
      startProcessTimer("Compressing on GCP worker (Ghostscript / FFmpeg)…");
    };

    xhr.onprogress = (event) => {
      if (!event.lengthComputable || event.total === 0) return;
      stopProcessTimer();
      const downloadRatio = event.loaded / event.total;
      const pct = 93 + Math.round(downloadRatio * 6);
      onProgress?.({
        phase: "download",
        percent: Math.min(pct, 99),
        label: `Receiving compressed file… ${Math.round(downloadRatio * 100)}%`,
      });
    };

    xhr.onload = () => {
      stopProcessTimer();
      onProgress?.({
        phase: "complete",
        percent: 100,
        label: "Complete",
      });
      const result = parseWorkerSuccess(xhr);
      resolve(result.ok ? result : { ok: false, error: result.error });
    };

    xhr.onerror = () => {
      stopProcessTimer();
      resolve({
        ok: false,
        error:
          "Network error reaching the compression worker. Check https://compression.clickcompress.com/health",
      });
    };

    xhr.ontimeout = () => {
      stopProcessTimer();
      resolve({
        ok: false,
        error: "Compression timed out. Try a smaller file.",
      });
    };

    xhr.send(formData);
  });
}
