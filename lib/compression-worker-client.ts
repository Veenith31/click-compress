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

/** Quick health ping — GCP worker is always on (no cold start). */
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

async function postCompressOnce(
  base: string,
  formData: FormData,
): Promise<WorkerCompressResult> {
  const response = await fetch(`${base}/compress`, {
    method: "POST",
    body: formData,
    signal: timeoutSignal(600_000),
  });

  if (!response.ok) {
    let message = `Worker error (${response.status})`;
    try {
      const json = (await response.json()) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      /* binary error body */
    }
    return { ok: false, error: message };
  }

  const blob = await response.blob();
  const outputName = response.headers.get("X-Output-Name") ?? "compressed.bin";
  const method = response.headers.get("X-Method") ?? "compressed";
  const note = response.headers.get("X-Note") ?? "Compressed on worker.";
  const originalSize = Number(response.headers.get("X-Original-Size") ?? 0);
  const compressedSize = Number(
    response.headers.get("X-Compressed-Size") ?? blob.size,
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

export async function compressViaWorker(
  formData: FormData,
): Promise<WorkerCompressResult> {
  const base = compressionWorkerUrl();
  if (!base) {
    return { ok: false, error: "Compression worker URL is not configured." };
  }

  try {
    return await postCompressOnce(base, formData);
  } catch (error) {
    return { ok: false, error: fetchErrorMessage(error) };
  }
}
