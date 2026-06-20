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

type WakeOptions = {
  maxWaitMs?: number;
  onWaiting?: (secondsElapsed: number) => void;
};

/** Ping /health until the worker responds (handles Render free-tier cold starts). */
export async function wakeCompressionWorker(
  options: WakeOptions = {},
): Promise<boolean> {
  const base = compressionWorkerUrl();
  if (!base) return false;

  const maxWaitMs = options.maxWaitMs ?? 90_000;
  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < maxWaitMs) {
    attempt += 1;
    const secondsElapsed = Math.floor((Date.now() - started) / 1000);
    options.onWaiting?.(secondsElapsed);

    try {
      const response = await fetch(`${base}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) return true;
    } catch {
      /* worker sleeping or still starting */
    }

    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(3000 + attempt * 500, 8000)),
    );
  }

  return false;
}

export async function compressViaWorker(
  formData: FormData,
): Promise<WorkerCompressResult> {
  const base = compressionWorkerUrl();
  if (!base) {
    return { ok: false, error: "Compression worker URL is not configured." };
  }

  try {
    const response = await fetch(`${base}/compress`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(600_000),
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
    const outputName =
      response.headers.get("X-Output-Name") ?? "compressed.bin";
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
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return {
        ok: false,
        error:
          "Compression timed out. Try a smaller file or retry — the worker may still be waking up.",
      };
    }
    return {
      ok: false,
      error:
        "Could not reach the compression worker. It may be waking up (free tier) — wait a minute and try again.",
    };
  }
}
